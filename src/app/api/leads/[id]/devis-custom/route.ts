import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, devis } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { calculerDevis } from "@/lib/business/calculer-devis";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      coeffSaison,
      coeffDate,
      coeffCapacite,
      marge,
      ajustementCustom,
      distanceKm: distanceKmOverride,
    } = body;

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

    if (!lead.besoin || !lead.departDate) {
      return NextResponse.json(
        { error: "Données du lead incomplètes" },
        { status: 400 },
      );
    }

    const [existingDevis] = await db
      .select()
      .from(devis)
      .where(eq(devis.leadId, id))
      .orderBy(desc(devis.version))
      .limit(1);

    const distanceKm =
      distanceKmOverride ?? existingDevis?.distanceKm;

    if (!distanceKm || distanceKm <= 0) {
      return NextResponse.json(
        { error: "distanceKm est requis" },
        { status: 400 },
      );
    }

    const result = calculerDevis(
      {
        distanceKm,
        besoin: lead.besoin,
        dateDepart: lead.departDate,
        nbPassagers: lead.voyageursMax ?? lead.voyageursMin ?? 1,
      },
      {
        coeffSaison: coeffSaison ?? undefined,
        coeffDate: coeffDate ?? undefined,
        coeffCapacite: coeffCapacite ?? undefined,
        marge: marge ?? undefined,
        ajustementCustom: ajustementCustom ?? undefined,
      },
    );

    const newVersion = (existingDevis?.version ?? 0) + 1;
    const reference = `NT-${Date.now().toString(36).toUpperCase()}`;

    const [newDevis] = await db
      .insert(devis)
      .values({
        leadId: id,
        reference,
        version: newVersion,
        distanceKm,
        prixHT: result.prixHT.toString(),
        prixTTC: result.prixTTC.toString(),
        coeffSaison: result.detail.coeffSaison.toString(),
        coeffDate: result.detail.coeffDate.toString(),
        coeffCapacite: result.detail.coeffCapacite.toString(),
        marge: result.detail.marge.toString(),
        ajustementCustom: result.detail.ajustementCustom.toString(),
      })
      .returning();

    await db
      .update(leads)
      .set({ status: "Devis généré" })
      .where(eq(leads.id, id));

    logger.commercial("Devis custom créé", `ref: ${reference}, lead: ${id.slice(0, 8)}, v${newVersion}, TTC: ${Math.round(result.prixTTC)}€`);

    return NextResponse.json({
      success: true,
      devis: {
        id: newDevis.id,
        reference: newDevis.reference,
        version: newDevis.version,
        prixHT: result.prixHT,
        prixTTC: result.prixTTC,
        detail: result.detail,
      },
    });
  } catch (error: unknown) {
    logger.system("ERREUR création devis custom", `${error}`);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
