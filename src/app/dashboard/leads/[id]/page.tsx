import { db } from "@/lib/db";
import { leads, prospects, devis, relances } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import LeadActions from "@/components/dashboard/lead-actions";

export const dynamic = "force-dynamic";

const BESOIN_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "Aller-retour",
  circuit: "Circuit",
};

const URGENCE_MAP: Record<string, { label: string; color: string }> = {
  DD_URGENT: { label: "URGENT", color: "text-red-500" },
  DD_NORMAL: { label: "DD_NORMAL", color: "text-gray-400" },
};

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getPrixBase(distanceKm: number): number {
  const grille: Record<number, number> = {
    10: 250, 20: 250, 30: 250, 40: 320, 50: 350,
    60: 390, 70: 430, 80: 500, 90: 540, 100: 580,
    110: 620, 120: 660, 130: 700, 140: 740, 150: 780,
    160: 820, 170: 860, 180: 900,
  };
  const paliers = Object.keys(grille).map(Number).sort((a, b) => a - b);
  for (const p of paliers) {
    if (distanceKm <= p) return grille[p];
  }
  return distanceKm * 2 * 2.5;
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const leadRows = await db
    .select({ lead: leads, prospect: prospects })
    .from(leads)
    .innerJoin(prospects, eq(leads.prospectId, prospects.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (leadRows.length === 0) notFound();

  const { lead, prospect } = leadRows[0];

  const allDevis = await db
    .select()
    .from(devis)
    .where(eq(devis.leadId, id))
    .orderBy(desc(devis.version));

  const allRelances = await db
    .select()
    .from(relances)
    .where(allDevis.length > 0 ? eq(relances.devisId, allDevis[0].id) : eq(relances.devisId, ""))
    .orderBy(desc(relances.envoyeLe));

  const latestDevis = allDevis[0] ?? null;

  const isHitl = lead.status === "Renvoyé au commercial" || lead.status === "Erreur distance";
  const pax = lead.voyageursMax ?? lead.voyageursMin ?? null;

  // Devis breakdown
  let devisSteps: { label: string; value: string; sign?: "+" | "-" | null }[] = [];
  if (latestDevis) {
    const prixBase = getPrixBase(latestDevis.distanceKm);
    const mult = parseFloat(latestDevis.prixHT) > prixBase * 1.5 * 1.5 ? 2 : 1;
    const coeffSaison = parseFloat(latestDevis.coeffSaison ?? "0");
    const coeffCap = parseFloat(latestDevis.coeffCapacite ?? "0");
    const marge = parseFloat(latestDevis.marge ?? "0.15");
    const prixHT = parseFloat(latestDevis.prixHT);
    const prixTTC = parseFloat(latestDevis.prixTTC);

    devisSteps = [
      { label: `Base distance (${latestDevis.distanceKm} km${mult === 2 ? " · A/R" : ""})`, value: `${Math.round(prixBase * mult).toLocaleString("fr-FR")} €`, sign: null },
      { label: `Coeff. saison — ${coeffSaison >= 0.15 ? "très haute" : coeffSaison >= 0.1 ? "haute" : "normale"}`, value: coeffSaison === 0 ? "—" : `${coeffSaison >= 0 ? "+" : ""}${Math.round(coeffSaison * 100)}%`, sign: coeffSaison >= 0 ? "+" : "-" },
      { label: `Coeff. capacité — ${pax ? `${pax} pax` : "—"}`, value: coeffCap === 0 ? "0%" : `${coeffCap >= 0 ? "+" : ""}${Math.round(coeffCap * 100)}%`, sign: coeffCap >= 0 ? "+" : "-" },
      { label: "Options", value: "—", sign: null },
      { label: `Marge commerciale · TVA`, value: `+${Math.round(marge * 100)}% · 10%`, sign: "+" },
    ];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
              <a href="/dashboard" className="hover:text-gray-600">← Pipeline</a>
              <span>/</span>
              <span>Lead #{id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {prospect.prenom} {prospect.nom}
                {lead.departVille && lead.arriveeVille && (
                  <span className="font-normal text-gray-500">
                    {" "}— {lead.departVille} → {lead.arriveeVille}
                  </span>
                )}
              </h1>
              {isHitl && (
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                  COMPLEXE_HITL
                </span>
              )}
            </div>
          </div>
          <LeadActions leadId={id} currentStatus={lead.status} />
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-[480px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-5">
            {/* DEMANDE */}
            <section className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Demande</p>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                <InfoRow label="Prospect" value={`${prospect.prenom ?? ""} ${prospect.nom ?? ""}`.trim()} />
                <InfoRow label="Email" value={prospect.email} />
                <InfoRow label="Tél" value={prospect.telephone ? `${prospect.telephone.slice(0, 2)}····${prospect.telephone.slice(-2)}` : "—"} />
                <InfoRow label="Passagers" value={pax?.toString() ?? "—"} />
                <InfoRow
                  label="Dates"
                  value={lead.departDate ? `${formatDate(lead.departDate)}${lead.arriveeDate ? ` → ${formatDate(lead.arriveeDate)}` : ""}` : "—"}
                />
                <InfoRow
                  label="Type"
                  value={BESOIN_LABELS[lead.besoin ?? ""] ?? lead.besoin ?? "—"}
                />
                <InfoRow
                  label="Urgence"
                  value={lead.departDate ? (() => {
                    const jours = Math.ceil((new Date(lead.departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (jours <= 14) return "URGENT";
                    return "DD_NORMAL";
                  })() : "—"}
                  valueClass={lead.departDate && Math.ceil((new Date(lead.departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 14 ? "text-red-500" : "text-gray-400"}
                />
              </div>
            </section>

            {/* DEVIS */}
            {latestDevis && (
              <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Devis</p>
                  <a
                    href={`/api/devis/${latestDevis.id}/pdf`}
                    target="_blank"
                    className="text-xs font-medium text-blue-500 hover:underline"
                  >
                    PDF ↗
                  </a>
                </div>
                <div className="rounded-xl border border-gray-100">
                  <div className="border-b border-gray-50 px-4 py-2.5">
                    <span className="text-xs font-medium text-gray-400">DEVIS — calculer_devis()</span>
                  </div>
                  {devisSteps.map((step, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5 last:border-0">
                      <span className="text-sm text-gray-600">{step.label}</span>
                      <span className={`text-sm font-medium ${step.sign === "+" ? "text-gray-500" : step.sign === "-" ? "text-green-600" : "text-gray-400"}`}>
                        {step.value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">Total TTC</span>
                    <span className="text-xl font-bold text-gray-900">
                      {Math.round(parseFloat(latestDevis.prixTTC)).toLocaleString("fr-FR")},00 €
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* RELANCES */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Relances automatiques
              </p>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                {allRelances.length > 0 ? (
                  allRelances.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-600">
                          J+{i === 0 ? 2 : 7} · relance {i + 1} envoyée
                        </span>
                      </div>
                      <span className="text-xs text-green-500">✓ ouverte</span>
                    </div>
                  ))
                ) : null}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    <span className="text-sm text-gray-500">J+7 · relance 2 planifiée</span>
                  </div>
                  <span className="text-xs text-yellow-500">en attente</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-gray-200" />
                  <span className="text-sm text-gray-400">Après J+7 · clôture auto (max 2 relances)</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right panel — PDF Preview */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Aperçu du devis
              </p>
              {latestDevis && (
                <a
                  href={`/api/devis/${latestDevis.id}/pdf`}
                  target="_blank"
                  className="text-xs font-medium text-blue-500 hover:underline"
                >
                  Ouvrir le PDF ↗
                </a>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {latestDevis ? (
                <iframe
                  src={`/api/devis/${latestDevis.id}/pdf`}
                  className="h-full w-full"
                  title="Aperçu du devis"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <p className="text-sm">Aucun devis généré</p>
                  <p className="mt-1 text-xs">Créez un devis depuis le pipeline</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${valueClass ?? "text-gray-900"}`}>{value}</span>
    </div>
  );
}
