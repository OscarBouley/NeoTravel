import { db } from "@/lib/db";
import { leads, prospects, devis, relances } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import LeadsTable from "@/components/dashboard/leads-table";

export const dynamic = "force-dynamic";

async function getStats() {
  const allLeads = await db
    .select({
      id: leads.id,
      status: leads.status,
      departDate: leads.departDate,
    })
    .from(leads);

  const allDevis = await db
    .select({
      id: devis.id,
      leadId: devis.leadId,
      prixTTC: devis.prixTTC,
      envoyeLe: devis.envoyeLe,
    })
    .from(devis);

  const relanceCount = await db
    .select({ total: count() })
    .from(relances);

  const total = allLeads.length;
  const devisGeneres = allDevis.length;
  const devisEnvoyes = allLeads.filter(
    (l) => l.status === "Devis envoyé",
  ).length;
  const devisAcceptes = allLeads.filter(
    (l) => l.status === "Devis accepté",
  ).length;
  const devisRefuses = allLeads.filter(
    (l) => l.status === "Devis refusé",
  ).length;

  const tauxConversion =
    devisEnvoyes + devisAcceptes + devisRefuses > 0
      ? Math.round(
          (devisAcceptes / (devisEnvoyes + devisAcceptes + devisRefuses)) *
            100,
        )
      : 0;

  const caAccepte = allLeads
    .filter((l) => l.status === "Devis accepté")
    .reduce((sum, l) => {
      const d = allDevis.find((dv) => dv.leadId === l.id);
      return sum + (d ? parseFloat(d.prixTTC) : 0);
    }, 0);

  const now = new Date();
  const dans7jours = new Date(now);
  dans7jours.setDate(dans7jours.getDate() + 7);
  const urgentes = allLeads.filter((l) => {
    if (!l.departDate) return false;
    if (l.status === "Devis accepté" || l.status === "Devis refusé")
      return false;
    const dep = new Date(l.departDate);
    return dep >= now && dep <= dans7jours;
  }).length;

  const enAttenteReponse = allLeads.filter(
    (l) => l.status === "Devis envoyé",
  ).length;

  return {
    total,
    devisGeneres,
    devisEnvoyes,
    devisAcceptes,
    devisRefuses,
    tauxConversion,
    caAccepte,
    urgentes,
    enAttenteReponse,
    totalRelances: relanceCount[0]?.total ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

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

  const relanceRows = await db.select().from(relances);
  const relancesByDevisId = new Map<string, number>();
  for (const r of relanceRows) {
    relancesByDevisId.set(
      r.devisId,
      (relancesByDevisId.get(r.devisId) ?? 0) + 1,
    );
  }

  const groupedByLead = new Map<
    string,
    { lead: typeof rows[0]["lead"]; prospect: typeof rows[0]["prospect"]; allDevis: (typeof rows[0]["devis"])[]; nbRelances: number }
  >();

  for (const row of rows) {
    const existing = groupedByLead.get(row.lead.id);
    if (existing) {
      if (row.devis) existing.allDevis.push(row.devis);
    } else {
      let nbRelances = 0;
      if (row.devis) {
        nbRelances = relancesByDevisId.get(row.devis.id) ?? 0;
      }
      groupedByLead.set(row.lead.id, {
        lead: row.lead,
        prospect: row.prospect,
        allDevis: row.devis ? [row.devis] : [],
        nbRelances,
      });
    }
  }

  for (const group of groupedByLead.values()) {
    let total = 0;
    for (const d of group.allDevis) {
      if (d) total += relancesByDevisId.get(d.id) ?? 0;
    }
    group.nbRelances = total;
  }

  const groupedRows = Array.from(groupedByLead.values());

  return (
    <div className="flex h-screen flex-col bg-navy-950 text-navy-100">
      <header className="shrink-0 border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <span className="text-xl font-bold tracking-tight">
            Neo<span className="text-lime-400">Travel</span>
            <span className="ml-3 text-sm font-normal text-navy-400">
              Dashboard
            </span>
          </span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a
              href="/"
              className="text-navy-400 transition-colors hover:text-navy-100"
            >
              Accueil
            </a>
            <a href="/dashboard" className="text-navy-100">
              Dashboard
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto">
          {/* KPIs principaux */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total leads" value={stats.total} />
            <StatCard label="Devis générés" value={stats.devisGeneres} />
            <StatCard label="Devis envoyés" value={stats.devisEnvoyes} color="blue" />
            <StatCard label="Acceptés" value={stats.devisAcceptes} color="green" />
            <StatCard label="Refusés" value={stats.devisRefuses} color="red" />
            <StatCard
              label="Taux conversion"
              value={`${stats.tauxConversion}%`}
              color={stats.tauxConversion >= 30 ? "green" : stats.tauxConversion >= 15 ? "yellow" : "red"}
            />
          </div>

          {/* KPIs opérationnels */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="CA accepté"
              value={`${Math.round(stats.caAccepte).toLocaleString()} €`}
              color="green"
            />
            <StatCard
              label="Demandes urgentes"
              value={stats.urgentes}
              color={stats.urgentes > 0 ? "red" : undefined}
            />
            <StatCard
              label="En attente réponse"
              value={stats.enAttenteReponse}
              color={stats.enAttenteReponse > 0 ? "yellow" : undefined}
            />
            <StatCard
              label="Relances envoyées"
              value={stats.totalRelances}
            />
          </div>

          <LeadsTable rows={groupedRows} />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: "green" | "red" | "yellow" | "blue";
}) {
  const colorClasses = {
    green: "text-lime-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
  };

  return (
    <div className="rounded-xl border border-navy-700/50 bg-navy-900 px-4 py-3">
      <p className="text-xs text-navy-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${color ? colorClasses[color] : "text-navy-100"}`}
      >
        {value}
      </p>
    </div>
  );
}
