import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        lead: leads,
        prospect: prospects,
        devis: devis,
      })
      .from(leads)
      .innerJoin(prospects, eq(leads.prospectId, prospects.id))
      .leftJoin(devis, eq(devis.leadId, leads.id))
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(rows);
  } catch (error: unknown) {
    console.error("Erreur liste leads:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nom,
      prenom,
      email,
      telephone,
      societe,
      departVille,
      departDate,
      departHeure,
      arriveeVille,
      arriveeDate,
      arriveeHeure,
      besoin,
      voyageursMin,
      voyageursMax,
    } = body;

    if (!nom || !email || !besoin || !departVille || !arriveeVille) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      let [prospect] = await tx
        .select()
        .from(prospects)
        .where(eq(prospects.email, email));

      if (prospect) {
        [prospect] = await tx
          .update(prospects)
          .set({
            nom,
            prenom: prenom || null,
            telephone: telephone || null,
            societe: societe || null,
          })
          .where(eq(prospects.id, prospect.id))
          .returning();
      } else {
        [prospect] = await tx
          .insert(prospects)
          .values({
            nom,
            prenom: prenom || null,
            email,
            telephone: telephone || null,
            societe: societe || null,
          })
          .returning();
      }

      const [lead] = await tx
        .insert(leads)
        .values({
          prospectId: prospect.id,
          departVille,
          departDate: departDate || null,
          departHeure: departHeure || null,
          arriveeVille,
          arriveeDate: arriveeDate || null,
          arriveeHeure: arriveeHeure || null,
          besoin,
          voyageursMin: voyageursMin ? Number(voyageursMin) : null,
          voyageursMax: voyageursMax ? Number(voyageursMax) : null,
        })
        .returning({ id: leads.id });

      return lead;
    });

    return NextResponse.json(
      { success: true, id: result.id },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erreur création lead:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
