import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "@ai-sdk/provider-utils";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculerDistanceKm } from "@/lib/geo/distance";
import { calculerDevis } from "@/lib/business/calculer-devis";
import { envoyerDevis } from "@/lib/email/envoyer-devis";

const SYSTEM_PROMPT = `Tu es l'assistant commercial de NeoTravel, spécialiste du transport de groupe (bus, autocar, minibus avec chauffeur).

TON RÔLE :
- Comprendre le besoin de transport du prospect
- Collecter TOUTES les informations nécessaires avant de créer le devis
- Ne jamais appeler l'outil creer_devis tant qu'il manque un seul champ

ORDRE DE COLLECTE STRICT :
D'abord les infos du trajet (étape 1), puis les infos personnelles (étape 2).

ÉTAPE 1 — TRAJET (collecter tout avant de passer à l'étape 2) :
- Type de déplacement : aller simple, aller-retour ou circuit
- Nombre de voyageurs (exact ou fourchette min/max)
- Ville de départ
- Date de départ (jour précis)
- Heure de départ
- Ville d'arrivée
- Date d'arrivée (jour précis)
- Heure d'arrivée

ÉTAPE 2 — COORDONNÉES (une fois le trajet complet) :
- Nom
- Prénom
- Email
- Téléphone
- Société / organisation

AVANT D'APPELER L'OUTIL :
- Vérifie que TOUS les champs ci-dessus sont renseignés, sans exception
- Si un champ manque, demande-le explicitement
- Fais un récapitulatif complet et demande confirmation
- N'appelle l'outil qu'après confirmation du prospect

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
- Après la création du devis, communique au prospect le tarif TTC renvoyé par l'outil et précise que le devis complet au format PDF a été envoyé en parallèle par email
- Utilise le champ "message" renvoyé par l'outil pour construire ta confirmation`;

const devisSchema = z.object({
  nom: z.string().describe("Nom de famille du prospect"),
  prenom: z.string().describe("Prénom du prospect"),
  email: z.string().email().describe("Email du prospect"),
  telephone: z.string().describe("Numéro de téléphone"),
  societe: z.string().describe("Société ou organisation du prospect"),
  besoin: z
    .enum(["aller_simple", "aller_retour", "circuit"])
    .describe("Type de déplacement"),
  depart_ville: z.string().describe("Ville de départ"),
  depart_date: z.string().describe("Date de départ au format YYYY-MM-DD"),
  depart_heure: z.string().describe("Heure de départ au format HH:MM"),
  arrivee_ville: z.string().describe("Ville d'arrivée"),
  arrivee_date: z.string().describe("Date d'arrivée au format YYYY-MM-DD"),
  arrivee_heure: z.string().describe("Heure d'arrivée au format HH:MM"),
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
});

type DevisInput = z.infer<typeof devisSchema>;

async function executeCreerDevis(params: DevisInput) {
  console.log("\n🚀 === DÉBUT CRÉATION DEVIS ===");
  console.log("📋 Params reçus:", JSON.stringify(params, null, 2));

  // 1. Upsert prospect
  console.log("\n👤 Step 1 — Upsert prospect...");
  let [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.email, params.email));

  if (prospect) {
    console.log(`  ✅ Prospect existant trouvé (${prospect.id.slice(0, 8)}), mise à jour...`);
    [prospect] = await db
      .update(prospects)
      .set({
        nom: params.nom,
        prenom: params.prenom,
        telephone: params.telephone,
        societe: params.societe,
      })
      .where(eq(prospects.id, prospect.id))
      .returning();
  } else {
    console.log("  ➕ Nouveau prospect, création...");
    [prospect] = await db
      .insert(prospects)
      .values({
        nom: params.nom,
        prenom: params.prenom,
        email: params.email,
        telephone: params.telephone,
        societe: params.societe,
      })
      .returning();
    console.log(`  ✅ Prospect créé (${prospect.id.slice(0, 8)})`);
  }

  // 2. Créer le lead
  console.log("\n📝 Step 2 — Création du lead...");
  const [lead] = await db
    .insert(leads)
    .values({
      prospectId: prospect.id,
      departVille: params.depart_ville,
      departDate: params.depart_date,
      departHeure: params.depart_heure,
      arriveeVille: params.arrivee_ville,
      arriveeDate: params.arrivee_date,
      arriveeHeure: params.arrivee_heure,
      besoin: params.besoin,
      voyageursMin: params.voyageurs_min,
      voyageursMax: params.voyageurs_max,
    })
    .returning({ id: leads.id });
  console.log(`  ✅ Lead créé (${lead.id.slice(0, 8)})`);

  // 3. Calculer la distance
  console.log("\n🗺️  Step 3 — Calcul de la distance...");
  let distanceKm: number;
  try {
    distanceKm = await calculerDistanceKm(
      params.depart_ville,
      params.arrivee_ville,
    );
  } catch (err) {
    console.error("  ❌ Erreur calcul distance:", err);
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

  // 4. Calculer le prix
  console.log("\n💰 Step 4 — Calcul du prix...");
  const nbPassagers = params.voyageurs_max;
  const result = calculerDevis({
    distanceKm,
    besoin: params.besoin,
    dateDepart: params.depart_date,
    nbPassagers,
  });
  console.log(`  💶 Prix HT: ${result.prixHT}€ | TTC: ${result.prixTTC}€`);
  console.log(`  📊 Coefficients — saison: ${result.detail.coeffSaison}, date: ${result.detail.coeffDate}, capacité: ${result.detail.coeffCapacite}`);

  if (result.detail.renvoyerCommercial) {
    console.log("  ⚠️  >85 passagers → renvoi au commercial");
    await db
      .update(leads)
      .set({ status: "Renvoyé au commercial" })
      .where(eq(leads.id, lead.id));
    return {
      success: true,
      leadId: lead.id,
      message: `Demande enregistrée (réf: ${lead.id.slice(0, 8)}). Votre groupe dépasse 85 personnes, un conseiller spécialisé vous recontactera sous 2h avec une offre sur mesure.`,
    };
  }

  // 5. Générer et envoyer le devis
  const reference = `NT-${Date.now().toString(36).toUpperCase()}`;
  console.log(`\n📧 Step 5 — Génération PDF + envoi email (réf: ${reference})...`);

  try {
    await envoyerDevis({
      reference,
      date: new Date().toISOString().slice(0, 10),
      prospect: {
        nom: prospect.nom ?? "",
        prenom: prospect.prenom ?? "",
        email: prospect.email,
        telephone: prospect.telephone ?? "",
        societe: prospect.societe ?? "",
      },
      voyage: {
        besoin: params.besoin,
        departVille: params.depart_ville,
        departDate: params.depart_date,
        departHeure: params.depart_heure,
        arriveeVille: params.arrivee_ville,
        arriveeDate: params.arrivee_date,
        arriveeHeure: params.arrivee_heure,
        nbPassagers,
      },
      prix: {
        prixHT: result.prixHT,
        prixTTC: result.prixTTC,
      },
    });
    console.log(`  ✅ Email envoyé à ${prospect.email}`);
  } catch (err) {
    console.error("  ❌ Erreur envoi email:", err);
    await db
      .update(leads)
      .set({ status: "Erreur envoi email" })
      .where(eq(leads.id, lead.id));
    return {
      success: true,
      leadId: lead.id,
      message: `Demande enregistrée et devis calculé (réf: ${lead.id.slice(0, 8)}). L'envoi de l'email a échoué, un conseiller vous recontactera sous 2h.`,
    };
  }

  // 6. Sauvegarder le devis en base
  console.log("\n💾 Step 6 — Sauvegarde du devis en base...");
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
      envoyeLe: new Date(),
    })
    .returning({ id: devis.id });
  console.log(`  ✅ Devis sauvegardé (${devisRecord.id.slice(0, 8)})`);

  // 7. Mettre à jour le statut du lead
  await db
    .update(leads)
    .set({ status: "Devis envoyé" })
    .where(eq(leads.id, lead.id));

  console.log("\n🎉 === DEVIS TERMINÉ ===\n");

  return {
    success: true,
    leadId: lead.id,
    devisId: devisRecord.id,
    reference,
    message: `Devis créé avec succès. Tarif : ${Math.round(result.prixTTC)} € TTC (réf: ${reference}). Le devis complet au format PDF a été envoyé par email à ${prospect.email}.`,
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
          "Crée une demande de devis, calcule le prix, génère le PDF et envoie le devis par email. N'appeler que quand TOUS les champs sont renseignés et confirmés par le prospect : besoin, depart_ville, depart_date, depart_heure, arrivee_ville, arrivee_date, arrivee_heure, voyageurs_min, voyageurs_max, nom, prenom, email, telephone, societe.",
        inputSchema: devisSchema,
        execute: executeCreerDevis,
      }),
    },
    stopWhen: stepCountIs(5),
    onError({ error }) {
      console.error("streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
