import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relances } from "@/lib/db/schema";
import { getRelancesAEnvoyer } from "@/lib/business/relances";
import { envoyerRelance } from "@/lib/email/envoyer-relance";
import { logger } from "@/lib/logger";

async function executeRelances(source: "cron" | "manuel") {
  const dues = await getRelancesAEnvoyer();
  logger.cron(`Relances déclenchées (${source})`, `${dues.length} relance(s) à envoyer`);

    const resultats = [];

    for (const relance of dues) {
      try {
        await envoyerRelance(relance);

        await db.insert(relances).values({
          devisId: relance.devisId,
          type: relance.type,
          envoyeLe: new Date(),
        });

        resultats.push({
          devisId: relance.devisId,
          email: relance.prospectEmail,
          type: relance.type,
          status: "sent",
        });

        logger.cron("Relance envoyée", `${relance.type} → ${relance.prospectEmail} (${relance.reference})${relance.urgent ? " [URGENT]" : ""}`);
      } catch (err) {
        logger.cron("ERREUR relance", `${relance.type} → ${relance.prospectEmail}: ${err}`);
        resultats.push({
          devisId: relance.devisId,
          email: relance.prospectEmail,
          type: relance.type,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown",
        });
      }
    }

    logger.cron("Relances terminées", `${resultats.filter((r) => r.status === "sent").length}/${dues.length} envoyées`);

  return NextResponse.json({
    total: dues.length,
    sent: resultats.filter((r) => r.status === "sent").length,
    errors: resultats.filter((r) => r.status === "error").length,
    details: resultats,
  });
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    return await executeRelances("cron");
  } catch (error: unknown) {
    logger.system("ERREUR cron relances", `${error}`);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const secret = body.secret;
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    return await executeRelances("manuel");
  } catch (error: unknown) {
    logger.system("ERREUR relances manuelles", `${error}`);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
