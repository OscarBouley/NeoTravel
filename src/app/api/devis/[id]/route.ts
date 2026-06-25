import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
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
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 },
      );
    }

    if (d.envoyeLe) {
      return NextResponse.json(
        { error: "Impossible de supprimer un devis déjà envoyé" },
        { status: 400 },
      );
    }

    await db.delete(devis).where(eq(devis.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erreur suppression devis:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
