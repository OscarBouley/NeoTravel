import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculerDevis } from "@/lib/business/calculer-devis";
import { envoyerDevis } from "@/lib/email/envoyer-devis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { distanceKm } = body;

    if (!distanceKm || typeof distanceKm !== "number" || distanceKm <= 0) {
      return NextResponse.json(
        { error: "distanceKm est requis (nombre positif)" },
        { status: 400 },
      );
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id));

    if (!lead) {
      return NextResponse.json(
        { error: "Lead introuvable" },
        { status: 404 },
      );
    }

    const [prospect] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, lead.prospectId));

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect introuvable" },
        { status: 404 },
      );
    }

    if (!lead.besoin || !lead.departDate) {
      return NextResponse.json(
        { error: "Données du lead incomplètes" },
        { status: 400 },
      );
    }

    const result = calculerDevis({
      distanceKm,
      besoin: lead.besoin,
      dateDepart: lead.departDate,
      nbPassagers: lead.voyageursMax ?? lead.voyageursMin ?? 1,
    });

    if (result.detail.renvoyerCommercial) {
      await db
        .update(leads)
        .set({ status: "Renvoyé au commercial" })
        .where(eq(leads.id, id));

      return NextResponse.json({
        success: false,
        reason: "capacite_depassee",
        message:
          "Plus de 85 passagers : le devis doit être traité manuellement par un commercial.",
      });
    }

    const reference = `NT-${Date.now().toString(36).toUpperCase()}`;

    const [devisRecord] = await db
      .insert(devis)
      .values({
        leadId: id,
        reference,
        distanceKm,
        prixHT: result.prixHT.toString(),
        prixTTC: result.prixTTC.toString(),
        coeffSaison: result.detail.coeffSaison.toString(),
        coeffDate: result.detail.coeffDate.toString(),
        coeffCapacite: result.detail.coeffCapacite.toString(),
        marge: result.detail.marge.toString(),
        ajustementCustom: result.detail.ajustementCustom.toString(),
        envoyeLe: new Date(),
      })
      .returning({ id: devis.id, reference: devis.reference });

    if (prospect.email) {
      await envoyerDevis({
        devisId: devisRecord.id,
        reference,
        date: new Date().toISOString().slice(0, 10),
        prospect: {
          nom: prospect.nom ?? "",
          prenom: prospect.prenom ?? "",
          email: prospect.email!,
          telephone: prospect.telephone ?? "",
          societe: prospect.societe ?? "",
        },
        voyage: {
          besoin: lead.besoin,
          departVille: lead.departVille ?? "",
          departDate: lead.departDate,
          departHeure: lead.departHeure ?? "",
          arriveeVille: lead.arriveeVille ?? "",
          arriveeDate: lead.arriveeDate ?? "",
          arriveeHeure: lead.arriveeHeure ?? "",
          nbPassagers: lead.voyageursMax ?? lead.voyageursMin ?? 1,
        },
        prix: {
          prixHT: result.prixHT,
          prixTTC: result.prixTTC,
        },
      });

      await db
        .update(leads)
        .set({ status: "Devis envoyé" })
        .where(eq(leads.id, id));
    } else {
      await db
        .update(leads)
        .set({ status: "Devis généré" })
        .where(eq(leads.id, id));
    }

    return NextResponse.json({
      success: true,
      devisId: devisRecord.id,
      reference: devisRecord.reference,
      prixHT: result.prixHT,
      prixTTC: result.prixTTC,
      detail: result.detail,
    });
  } catch (error: unknown) {
    console.error("Erreur envoi devis:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
