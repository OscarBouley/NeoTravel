import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculerDistanceKm } from "@/lib/geo/distance";
import { calculerDevis } from "@/lib/business/calculer-devis";

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

    const { prospect, lead } = await db.transaction(async (tx) => {
      let [p] = await tx
        .select()
        .from(prospects)
        .where(eq(prospects.email, email));

      if (p) {
        [p] = await tx
          .update(prospects)
          .set({
            nom,
            prenom: prenom || null,
            telephone: telephone || null,
            societe: societe || null,
          })
          .where(eq(prospects.id, p.id))
          .returning();
      } else {
        [p] = await tx
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

      const [l] = await tx
        .insert(leads)
        .values({
          prospectId: p.id,
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
        .returning();

      return { prospect: p, lead: l };
    });

    console.log(`📝 Lead formulaire créé (${lead.id.slice(0, 8)}), qualification auto...`);

    let distanceKm: number;
    try {
      distanceKm = await calculerDistanceKm(departVille, arriveeVille);
    } catch (err) {
      console.error("❌ Erreur distance:", err);
      await db
        .update(leads)
        .set({ status: "Erreur distance" })
        .where(eq(leads.id, lead.id));
      return NextResponse.json(
        { success: true, id: lead.id, status: "Erreur distance" },
        { status: 201 },
      );
    }

    const nbPassagers = (voyageursMax ? Number(voyageursMax) : voyageursMin ? Number(voyageursMin) : 1);

    if (nbPassagers > 85) {
      await db
        .update(leads)
        .set({ status: "Renvoyé au commercial" })
        .where(eq(leads.id, lead.id));
      return NextResponse.json(
        { success: true, id: lead.id, status: "Renvoyé au commercial" },
        { status: 201 },
      );
    }

    const result = calculerDevis({
      distanceKm,
      besoin,
      dateDepart: departDate,
      nbPassagers,
    });

    const reference = `NT-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(devis).values({
      leadId: lead.id,
      reference,
      distanceKm,
      prixHT: result.prixHT.toString(),
      prixTTC: result.prixTTC.toString(),
      coeffSaison: result.detail.coeffSaison.toString(),
      coeffDate: result.detail.coeffDate.toString(),
      coeffCapacite: result.detail.coeffCapacite.toString(),
      marge: result.detail.marge.toString(),
      ajustementCustom: result.detail.ajustementCustom.toString(),
      version: 1,
    });

    await db
      .update(leads)
      .set({ status: "Devis généré" })
      .where(eq(leads.id, lead.id));

    console.log(`✅ Devis généré automatiquement — ${distanceKm}km, ${result.prixTTC}€ TTC`);

    return NextResponse.json(
      { success: true, id: lead.id, status: "Devis généré" },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erreur création lead:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
