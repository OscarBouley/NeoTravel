import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { envoyerDevis } from "@/lib/email/envoyer-devis";

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

    await envoyerDevis({
      devisId: id,
      reference: d.reference,
      date: d.createdAt.toISOString().slice(0, 10),
      prospect: {
        nom: prospect.nom ?? "",
        prenom: prospect.prenom ?? "",
        email: prospect.email,
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

    return NextResponse.json({
      success: true,
      message: `Devis ${d.reference} envoyé à ${prospect.email}`,
    });
  } catch (error: unknown) {
    console.error("Erreur envoi devis:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
