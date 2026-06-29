import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [d] = await db.select().from(devis).where(eq(devis.id, id));
    if (!d) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if (d.envoyeLe) {
      return NextResponse.json({ error: "Impossible de modifier un devis déjà envoyé" }, { status: 400 });
    }

    await db
      .update(devis)
      .set({
        coeffSaison: body.coeffSaison?.toString() ?? d.coeffSaison,
        coeffDate: body.coeffDate?.toString() ?? d.coeffDate,
        coeffCapacite: body.coeffCapacite?.toString() ?? d.coeffCapacite,
        marge: body.marge?.toString() ?? d.marge,
        ajustementCustom: body.ajustementCustom?.toString() ?? d.ajustementCustom,
        prixHT: body.prixHT?.toString() ?? d.prixHT,
        prixTTC: body.prixTTC?.toString() ?? d.prixTTC,
      })
      .where(eq(devis.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erreur mise à jour devis:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
