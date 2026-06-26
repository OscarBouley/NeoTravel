import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const leadUpdates: Record<string, unknown> = {};
    if (body.departVille !== undefined) leadUpdates.departVille = body.departVille;
    if (body.arriveeVille !== undefined) leadUpdates.arriveeVille = body.arriveeVille;
    if (body.departDate !== undefined) leadUpdates.departDate = body.departDate;
    if (body.departHeure !== undefined) leadUpdates.departHeure = body.departHeure;
    if (body.arriveeDate !== undefined) leadUpdates.arriveeDate = body.arriveeDate;
    if (body.arriveeHeure !== undefined) leadUpdates.arriveeHeure = body.arriveeHeure;
    if (body.besoin !== undefined) leadUpdates.besoin = body.besoin;
    if (body.voyageursMin !== undefined) leadUpdates.voyageursMin = body.voyageursMin;
    if (body.voyageursMax !== undefined) leadUpdates.voyageursMax = body.voyageursMax;

    if (Object.keys(leadUpdates).length > 0) {
      await db.update(leads).set(leadUpdates).where(eq(leads.id, id));
    }

    const prospectUpdates: Record<string, unknown> = {};
    if (body.prospectNom !== undefined) prospectUpdates.nom = body.prospectNom;
    if (body.prospectPrenom !== undefined) prospectUpdates.prenom = body.prospectPrenom;
    if (body.prospectEmail !== undefined) prospectUpdates.email = body.prospectEmail;
    if (body.prospectTelephone !== undefined) prospectUpdates.telephone = body.prospectTelephone;
    if (body.prospectSociete !== undefined) prospectUpdates.societe = body.prospectSociete;

    if (Object.keys(prospectUpdates).length > 0) {
      await db.update(prospects).set(prospectUpdates).where(eq(prospects.id, lead.prospectId));
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Erreur mise à jour lead:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
