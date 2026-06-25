import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "accepter" && action !== "decliner") {
      return NextResponse.json(
        { error: "Action invalide" },
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
      .select({ status: leads.status })
      .from(leads)
      .where(eq(leads.id, d.leadId));

    if (
      lead?.status === "Devis accepté" ||
      lead?.status === "Devis refusé"
    ) {
      return NextResponse.json(
        { error: "already_responded", status: lead.status },
        { status: 409 },
      );
    }

    const newStatus =
      action === "accepter" ? "Devis accepté" : "Devis refusé";

    await db
      .update(leads)
      .set({ status: newStatus })
      .where(eq(leads.id, d.leadId));

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: unknown) {
    console.error("Erreur réponse devis:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
