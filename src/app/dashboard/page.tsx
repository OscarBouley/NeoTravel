import { db } from "@/lib/db";
import { leads, prospects, devis } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import LeadsTable from "@/components/dashboard/leads-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  return (
    <div className="flex h-screen flex-col bg-navy-950 text-navy-100">
      {/* Header */}
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total demandes"
              value={new Set(rows.map((r) => r.lead.id)).size}
            />
            <StatCard
              label="Devis générés"
              value={rows.filter((r) => r.devis).length}
            />
            <StatCard
              label="Devis envoyés"
              value={
                rows.filter((r) => r.lead.status === "Devis envoyé").length
              }
            />
            <StatCard
              label="En attente"
              value={
                rows.filter(
                  (r) =>
                    r.lead.status === "Nouvelle demande" ||
                    r.lead.status === "Devis généré",
                ).length
              }
            />
          </div>

          <LeadsTable rows={rows} />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-700/50 bg-navy-900 px-4 py-3">
      <p className="text-xs text-navy-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy-100">{value}</p>
    </div>
  );
}
