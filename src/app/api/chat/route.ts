import { streamText, smoothStream, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "@ai-sdk/provider-utils";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculerDistanceKm } from "@/lib/geo/distance";
import { calculerDevis } from "@/lib/business/calculer-devis";
import { logger } from "@/lib/logger";

const SYSTEM_PROMPT = `Tu es l'assistant commercial de NeoTravel, spécialiste du transport de groupe (bus, autocar, minibus avec chauffeur).

TON RÔLE :
- Comprendre le besoin de transport du prospect
- Collecter TOUTES les informations nécessaires avant de créer le devis
- Ne jamais appeler l'outil creer_devis tant qu'il manque un seul champ

ORDRE DE COLLECTE STRICT :
D'abord les infos du trajet (étape 1), puis les infos personnelles (étape 2).
Pour chaque étape essaye de dire tout ce dont tu as besoin en un seul message.

ÉTAPE 1 — TRAJET (collecter tout avant de passer à l'étape 2) :
- Type de déplacement : aller simple, aller-retour ou circuit
- Nombre de voyageurs (exact ou fourchette min/max)
- Ville de départ
- Date de départ (jour précis)
- Heure de départ
- Ville d'arrivée
- Date d'arrivée (jour précis)

NOTE : Ne demande JAMAIS l'heure d'arrivée au prospect. L'heure d'arrivée estimée sera calculée automatiquement à partir de la distance et d'une vitesse moyenne de 80 km/h.

ÉTAPE 2 — COORDONNÉES (une fois le trajet complet) :
- Nom (obligatoire)
- Prénom (obligatoire)
- Société / organisation (obligatoire)

IMPORTANT — EMAIL ET TÉLÉPHONE :
- Ne demande PAS l'email ni le téléphone pendant la collecte
- Crée le devis dès que nom, prénom, société et les infos trajet sont confirmés
- APRÈS avoir créé le devis et communiqué le tarif, propose :
  "Si vous souhaitez recevoir ce devis par email, vous pouvez me laisser votre adresse mail. Et si vous souhaitez être recontacté par un conseiller, n'hésitez pas à me communiquer votre numéro de téléphone."
- Si le prospect fournit ensuite un email ou téléphone, utilise l'outil mettre_a_jour_contact pour les enregistrer

AVANT D'APPELER L'OUTIL creer_devis :
- Vérifie que les infos trajet + nom, prénom et société sont renseignés
- Si un champ obligatoire manque, demande-le explicitement
- Fais un récapitulatif complet et demande confirmation
- N'appelle l'outil qu'après confirmation du prospect de ton résumé des infos

RÈGLES DE STYLE :
- N'utilise JAMAIS de markdown : pas de gras (**), pas d'italique (*), pas de titres (#), pas de listes avec tirets ou puces
- Écris en texte simple, avec des retours à la ligne pour aérer
- Sois concis, professionnel et chaleureux
- Pose les questions progressivement, pas tout d'un coup
- Utilise des emojis avec parcimonie pour rester chaleureux

RÈGLES MÉTIER :
- Pendant la collecte, tu ne donnes JAMAIS de prix, estimation, tarif ou fourchette de prix
- Si on te demande un prix avant la création du devis, réponds que le prix sera calculé automatiquement une fois toutes les infos réunies
- Tu ne négocies rien, tu collectes les informations
- Après la création du devis, communique au prospect le tarif TTC renvoyé par l'outil, puis propose de laisser un email pour recevoir le devis ou un téléphone pour être recontacté
- Utilise le champ "message" renvoyé par l'outil pour construire ta confirmation

CAS COMPLEXES — CRÉATION PARTIELLE :
Si tu détectes un cas complexe pendant la collecte, tu dois quand même collecter toutes les informations possibles, puis appeler l'outil normalement. L'outil gérera l'escalade automatiquement pour les >85 passagers.

Les cas complexes sont :
- Plus de 85 passagers (géré automatiquement par l'outil)
- Circuit avec plus de 3 étapes ou itinéraire non standard
- Demande incluant des besoins spéciaux (accessibilité PMR, transport de matériel volumineux, animaux)
- Trajet international ou vers des zones non desservies par le réseau routier standard
- Demande pour une prestation sur plusieurs jours avec hébergement
- Tout cas où tu n'es pas sûr de pouvoir qualifier correctement la demande
- Tout cas où la demande mentionne clairement être complexe ou nécessiter un traitement humain

Pour ces cas (hors >85 pax qui est automatique), explique au prospect :
"Votre demande nécessite une attention particulière. Je vais enregistrer toutes les informations que vous m'avez transmises et un conseiller commercial reprendra contact avec vous sous 2 heures pour vous proposer une offre adaptée."
Puis appelle l'outil avec le champ complexe à true pour signaler le cas.`;

const devisSchema = z.object({
  nom: z.string().describe("Nom de famille du prospect"),
  prenom: z.string().describe("Prénom du prospect"),
  societe: z.string().describe("Société ou organisation du prospect"),
  besoin: z
    .enum(["aller_simple", "aller_retour", "circuit"])
    .describe("Type de déplacement"),
  depart_ville: z.string().describe("Ville de départ"),
  depart_date: z.string().describe("Date de départ au format YYYY-MM-DD"),
  depart_heure: z.string().describe("Heure de départ au format HH:MM"),
  arrivee_ville: z.string().describe("Ville d'arrivée"),
  arrivee_date: z.string().describe("Date d'arrivée au format YYYY-MM-DD"),
  voyageurs_min: z
    .number()
    .int()
    .positive()
    .describe("Nombre minimum de voyageurs"),
  voyageurs_max: z
    .number()
    .int()
    .positive()
    .describe("Nombre maximum de voyageurs (identique à min si exact)"),
  complexe: z
    .boolean()
    .optional()
    .describe("Mettre à true si le cas est complexe (circuit multi-étapes, besoins spéciaux PMR, international, multi-jours, etc.). Les >85 pax sont gérés automatiquement."),
  detail_complexe: z
    .string()
    .optional()
    .describe("Si complexe est true, décris en une ou deux phrases ce qui rend la demande complexe (ex: 'PMR nécessitant un véhicule adapté', 'Circuit 5 étapes sur 3 jours avec hébergement'). Obligatoire si complexe est true."),
});

type DevisInput = z.infer<typeof devisSchema>;

function calculerHeureArrivee(heureDepart: string, distanceKm: number): string {
  const [h, m] = heureDepart.split(":").map(Number);
  const minutesTrajet = Math.round((distanceKm / 80) * 60);
  const totalMinutes = h * 60 + m + minutesTrajet;
  const hArrivee = Math.floor(totalMinutes / 60) % 24;
  const mArrivee = totalMinutes % 60;
  return `${String(hArrivee).padStart(2, "0")}:${String(mArrivee).padStart(2, "0")}`;
}

async function executeCreerDevis(params: DevisInput) {
  logger.ia("DÉBUT CRÉATION DEVIS", `prospect: ${params.prenom} ${params.nom}`);

  // 1. Créer le prospect
  const [prospect] = await db
    .insert(prospects)
    .values({
      nom: params.nom,
      prenom: params.prenom,
      societe: params.societe,
    })
    .returning();

  // 2. Créer le lead (arriveeHeure sera mis à jour après calcul de distance)
  const [lead] = await db
    .insert(leads)
    .values({
      prospectId: prospect.id,
      departVille: params.depart_ville,
      departDate: params.depart_date,
      departHeure: params.depart_heure,
      arriveeVille: params.arrivee_ville,
      arriveeDate: params.arrivee_date,
      besoin: params.besoin,
      voyageursMin: params.voyageurs_min,
      voyageursMax: params.voyageurs_max,
      detailComplexe: params.detail_complexe ?? null,
    })
    .returning({ id: leads.id });
  logger.ia("Lead créé", `id: ${lead.id.slice(0, 8)}, trajet: ${params.depart_ville} → ${params.arrivee_ville}`);

  // 3. Calculer la distance
  let distanceKm: number;
  try {
    distanceKm = await calculerDistanceKm(
      params.depart_ville,
      params.arrivee_ville,
    );
  } catch (err) {
    logger.ia("ERREUR calcul distance", `${params.depart_ville} → ${params.arrivee_ville}: ${err}`);
    await db
      .update(leads)
      .set({ status: "Erreur distance" })
      .where(eq(leads.id, lead.id));
    return {
      success: true,
      leadId: lead.id,
      message: `Demande enregistrée (réf: ${lead.id.slice(0, 8)}). Le calcul automatique de distance a échoué, un conseiller traitera votre demande manuellement sous 2h.`,
    };
  }

  // 3b. Calculer et stocker l'heure d'arrivée estimée
  const arriveeHeure = calculerHeureArrivee(params.depart_heure, distanceKm);
  await db
    .update(leads)
    .set({ arriveeHeure })
    .where(eq(leads.id, lead.id));

  // 4. Calculer le prix
  const nbPassagers = params.voyageurs_max;
  const result = calculerDevis({
    distanceKm,
    besoin: params.besoin,
    dateDepart: params.depart_date,
    nbPassagers,
  });
  logger.ia("Prix calculé", `HT: ${result.prixHT}€ | TTC: ${result.prixTTC}€ | distance: ${distanceKm}km`);

  if (result.detail.renvoyerCommercial || params.complexe) {
    const raison = result.detail.renvoyerCommercial ? ">85 passagers" : "cas complexe signalé par l'IA";
    logger.ia("Renvoi au commercial", `lead: ${lead.id.slice(0, 8)}, raison: ${raison}`);
    const detailAuto = result.detail.renvoyerCommercial
      ? `Plus de 85 passagers (${nbPassagers} pax demandés)`
      : params.detail_complexe;
    await db
      .update(leads)
      .set({
        status: "Renvoyé au commercial",
        ...(detailAuto && { detailComplexe: detailAuto }),
      })
      .where(eq(leads.id, lead.id));
    const msgClient = result.detail.renvoyerCommercial
      ? `Demande enregistrée (réf: ${lead.id.slice(0, 8)}). Votre groupe dépasse 85 personnes, un conseiller spécialisé vous recontactera sous 2h avec une offre sur mesure.`
      : `Demande enregistrée (réf: ${lead.id.slice(0, 8)}). Votre demande nécessite une attention particulière, un conseiller commercial spécialisé reprendra contact avec vous sous très prochainement pour vous proposer une offre adaptée.`;
    return {
      success: true,
      leadId: lead.id,
      message: msgClient,
    };
  }

  // 5. Sauvegarder le devis en base (sans envoyer l'email — le commercial validera depuis le dashboard)
  const reference = `NT-${Date.now().toString(36).toUpperCase()}`;
  const [devisRecord] = await db
    .insert(devis)
    .values({
      leadId: lead.id,
      reference,
      distanceKm,
      prixHT: result.prixHT.toString(),
      prixTTC: result.prixTTC.toString(),
      coeffSaison: result.detail.coeffSaison.toString(),
      coeffDate: result.detail.coeffDate.toString(),
      coeffCapacite: result.detail.coeffCapacite.toString(),
      marge: result.detail.marge.toString(),
    })
    .returning({ id: devis.id });

  // 6. Mettre à jour le statut du lead
  await db
    .update(leads)
    .set({ status: "Devis généré" })
    .where(eq(leads.id, lead.id));

  logger.ia("Devis créé", `ref: ${reference}, lead: ${lead.id.slice(0, 8)}, TTC: ${Math.round(result.prixTTC)}€`);

  return {
    success: true,
    leadId: lead.id,
    devisId: devisRecord.id,
    reference,
    message: `Devis généré avec succès (réf: ${reference}), tarif : ${Math.round(result.prixTTC)} € TTC.`,
  };
}

const contactSchema = z.object({
  lead_id: z.string().describe("L'identifiant du lead retourné par creer_devis (champ leadId)"),
  email: z.string().email().optional().describe("Email du prospect"),
  telephone: z.string().optional().describe("Numéro de téléphone du prospect"),
});

async function executeMettreAJourContact(params: z.infer<typeof contactSchema>) {
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, params.lead_id));

  if (!lead) {
    return { success: false, message: "Lead introuvable" };
  }

  const updates: Record<string, string> = {};
  if (params.email) updates.email = params.email;
  if (params.telephone) updates.telephone = params.telephone;

  if (Object.keys(updates).length > 0) {
    await db
      .update(prospects)
      .set(updates)
      .where(eq(prospects.id, lead.prospectId));
  }

  const parts: string[] = [];
  if (params.email) parts.push(`email (${params.email})`);
  if (params.telephone) parts.push(`téléphone (${params.telephone})`);

  return {
    success: true,
    message: `Coordonnées enregistrées : ${parts.join(" et ")}. Un conseiller vous recontactera prochainement.`,
  };
}

export async function POST(req: Request) {
  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4"),
    system: SYSTEM_PROMPT,
    messages,
    temperature: 0.3,
    tools: {
      creer_devis: tool({
        description:
          "Crée une demande de devis et calcule le prix. N'appeler que quand les champs obligatoires sont renseignés et confirmés par le prospect : besoin, depart_ville, depart_date, depart_heure, arrivee_ville, arrivee_date, voyageurs_min, voyageurs_max, nom, prenom, societe. L'heure d'arrivée est calculée automatiquement. Email et téléphone ne sont PAS requis pour créer le devis.",
        inputSchema: devisSchema,
        execute: executeCreerDevis,
      }),
      mettre_a_jour_contact: tool({
        description:
          "Enregistre l'email et/ou le téléphone du prospect après la création du devis. Appeler uniquement quand le prospect fournit volontairement son email ou son numéro de téléphone après avoir reçu son tarif.",
        inputSchema: contactSchema,
        execute: executeMettreAJourContact,
      }),
    },
    experimental_transform: smoothStream({ chunking: "word" }),
    stopWhen: stepCountIs(5),
    onError({ error }) {
      console.error("streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
