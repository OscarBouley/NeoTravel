import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "@ai-sdk/provider-utils";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
- Tu ne donnes JAMAIS de prix, estimation, tarif ou fourchette de prix
- Si on te demande un prix, réponds que tu vas transmettre la demande et qu'un conseiller reviendra avec un devis chiffré sous 2h
- Tu ne négocies rien, tu collectes les informations
- Après la création du devis, confirme que la demande est enregistrée et qu'un conseiller recontactera sous 2h`;

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
  const result = await db.transaction(async (tx) => {
    let [prospect] = await tx
      .select()
      .from(prospects)
      .where(eq(prospects.email, params.email));

    if (prospect) {
      [prospect] = await tx
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
      [prospect] = await tx
        .insert(prospects)
        .values({
          nom: params.nom,
          prenom: params.prenom,
          email: params.email,
          telephone: params.telephone,
          societe: params.societe,
        })
        .returning();
    }

    const [lead] = await tx
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

    return lead;
  });

  return {
    success: true,
    devisId: result.id,
    message: `Demande de devis créée (réf: ${result.id.slice(0, 8)})`,
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
          "Crée une demande de devis. N'appeler que quand TOUS les champs sont renseignés et confirmés par le prospect : besoin, depart_ville, depart_date, depart_heure, arrivee_ville, arrivee_date, arrivee_heure, voyageurs_min, voyageurs_max, nom, prenom, email, telephone, societe.",
        inputSchema: devisSchema,
        execute: executeCreerDevis,
      }),
    },
    stopWhen: stepCountIs(3),
    onError({ error }) {
      console.error("streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
