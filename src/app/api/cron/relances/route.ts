import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relances } from "@/lib/db/schema";
import { getRelancesAEnvoyer } from "@/lib/business/relances";
import { envoyerRelance } from "@/lib/email/envoyer-relance";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    console.log("\n⏰ === CRON RELANCES ===");

    const dues = await getRelancesAEnvoyer();
    console.log(`📋 ${dues.length} relance(s) à envoyer`);

    const resultats = [];

    for (const relance of dues) {
      try {
        console.log(
          `  📧 ${relance.type} → ${relance.prospectEmail} (${relance.reference})${relance.urgent ? " [URGENT]" : ""}`,
        );

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

        console.log(`  ✅ Envoyé`);
      } catch (err) {
        console.error(`  ❌ Erreur:`, err);
        resultats.push({
          devisId: relance.devisId,
          email: relance.prospectEmail,
          type: relance.type,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown",
        });
      }
    }

    console.log(`\n🏁 Terminé — ${resultats.filter((r) => r.status === "sent").length}/${dues.length} envoyées\n`);

    return NextResponse.json({
      total: dues.length,
      sent: resultats.filter((r) => r.status === "sent").length,
      errors: resultats.filter((r) => r.status === "error").length,
      details: resultats,
    });
  } catch (error: unknown) {
    console.error("Erreur cron relances:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
