import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [d] = await db.select().from(devis).where(eq(devis.id, id));
    if (!d) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const [lead] = await db.select().from(leads).where(eq(leads.id, d.leadId));
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, lead.prospectId));

    return NextResponse.json({ hasTelephone: !!prospect.telephone });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { telephone } = body;

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

    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, lead.prospectId));

    if (telephone && typeof telephone === "string" && telephone.trim().length >= 6) {
      await db
        .update(prospects)
        .set({ telephone: telephone.trim() })
        .where(eq(prospects.id, lead.prospectId));
      logger.commercial("Demande d'infos", `devis: ${d.reference}, tél: ${telephone.trim()}`);
    } else if (!prospect.telephone) {
      return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });
    } else {
      logger.commercial("Demande d'infos", `devis: ${d.reference}, tél existant: ${prospect.telephone}`);
    }

    await db
      .update(leads)
      .set({ status: "Devis refusé" })
      .where(eq(leads.id, d.leadId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.system("ERREUR contact devis", `${error}`);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
