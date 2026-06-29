import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { telephone } = body;

    if (!telephone || typeof telephone !== "string" || telephone.trim().length < 6) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide" },
        { status: 400 },
      );
    }

    const [d] = await db
      .select()
      .from(devis)
      .where(eq(devis.id, id));

    if (!d) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 },
      );
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, d.leadId));

    await db
      .update(prospects)
      .set({ telephone: telephone.trim() })
      .where(eq(prospects.id, lead.prospectId));

    await db
      .update(leads)
      .set({ status: "Demande d'infos" })
      .where(eq(leads.id, d.leadId));

    logger.commercial("Demande d'infos", `devis: ${d.reference}, tél: ${telephone.trim()}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.system("ERREUR contact devis", `${error}`);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
