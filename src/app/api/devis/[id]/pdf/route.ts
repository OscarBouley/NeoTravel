import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DevisPdf } from "@/lib/email/devis-pdf";

export async function GET(
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
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, d.leadId));

    const [prospect] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, lead.prospectId));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(DevisPdf, {
        data: {
          reference: d.reference,
          date: d.createdAt.toISOString().slice(0, 10),
          prospect: {
            nom: prospect.nom ?? "",
            prenom: prospect.prenom ?? "",
            email: prospect.email,
            telephone: prospect.telephone ?? "",
            societe: prospect.societe ?? "",
          },
          voyage: {
            besoin: lead.besoin ?? "",
            departVille: lead.departVille ?? "",
            departDate: lead.departDate ?? "",
            departHeure: lead.departHeure ?? "",
            arriveeVille: lead.arriveeVille ?? "",
            arriveeDate: lead.arriveeDate ?? "",
            arriveeHeure: lead.arriveeHeure ?? "",
            nbPassagers: lead.voyageursMax ?? lead.voyageursMin ?? 1,
          },
          prix: {
            prixHT: parseFloat(d.prixHT),
            prixTTC: parseFloat(d.prixTTC),
          },
        },
      }) as any,
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="devis-${d.reference}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Erreur génération PDF:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
