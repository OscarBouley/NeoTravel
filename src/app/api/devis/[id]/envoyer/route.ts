import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { envoyerDevis } from "@/lib/email/envoyer-devis";
import { logger } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [d] = await db
      .select()
      .from(devis)
      .where(eq(devis.id, id));

    if (!d) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, d.leadId));

    const [prospect] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, lead.prospectId));

    if (!prospect.email) {
      return NextResponse.json(
        { error: "Impossible d'envoyer : le prospect n'a pas d'adresse email" },
        { status: 400 },
      );
    }

    await envoyerDevis({
      devisId: id,
      isRevision: d.version > 1,
      reference: d.reference,
      date: d.createdAt.toISOString().slice(0, 10),
      prospect: {
        nom: prospect.nom ?? "",
        prenom: prospect.prenom ?? "",
        email: prospect.email!,
        telephone: prospect.telephone ?? "",
        societe: prospect.societe ?? "",
      },
      voyage: {
        besoin: lead.besoin ?? "",
        departVille: lead.departVille ?? "",
        departDate: lead.departDate ?? "",
        departHeure: lead.departHeure ?? "",
        arriveeVille: lead.arriveeVille ?? "",
        arriveeDate: lead.arriveeDate ?? "",
        arriveeHeure: lead.arriveeHeure ?? "",
        nbPassagers: lead.voyageursMax ?? lead.voyageursMin ?? 1,
      },
      prix: {
        prixHT: parseFloat(d.prixHT),
        prixTTC: parseFloat(d.prixTTC),
      },
    });

    await db
      .update(devis)
      .set({ envoyeLe: new Date() })
      .where(eq(devis.id, id));

    await db
      .update(leads)
      .set({ status: "Devis envoyé" })
      .where(eq(leads.id, d.leadId));

    logger.commercial("Devis envoyé", `ref: ${d.reference}, email: ${prospect.email!}`);

    return NextResponse.json({
      success: true,
      message: `Devis ${d.reference} envoyé à ${prospect.email!}`,
    });
  } catch (error: unknown) {
    logger.system("ERREUR envoi devis", `${error}`);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
