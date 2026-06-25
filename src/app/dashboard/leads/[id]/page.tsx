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
      {/* Sidebar */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-navy-800 bg-navy-950">
        <div className="border-b border-navy-800 p-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-navy-950">N</div>
            <span className="text-base font-bold text-navy-100">NeoTravel</span>
          </a>
        </div>
        <nav className="flex-1 p-3">
          <a href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-400 hover:bg-navy-800/50 hover:text-navy-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 0 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
            </svg>
            Pipeline
          </a>
        </nav>
        <div className="border-t border-navy-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-navy-100">A</div>
            <div>
              <p className="text-sm font-medium text-navy-100">Admin</p>
              <p className="text-xs text-navy-400">Commercial</p>
            </div>
          </div>
        </div>
      </aside>

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

          {/* Right panel — Conversation */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Conversation</p>
              <span className="text-xs text-gray-400">agent IA → vous</span>
            </div>

            <div className="flex flex-1 flex-col justify-end overflow-y-auto p-5">
              {/* Empty state */}
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <p className="text-sm">Historique non disponible</p>
                <p className="mt-1 text-xs">La conversation IA n&apos;est pas stockée</p>
              </div>
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 bg-white px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                <span className="text-xs font-medium text-gray-500">
                  Vous répondez maintenant en direct au prospect
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Votre réponse au client..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
                />
                <button className="rounded-xl bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800">
                  Envoyer
                </button>
              </div>
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
