import { db } from "@/lib/db";
import { leads, prospects, devis, relances } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import PipelineBoard, { type KanbanColumnKey, type GroupedRow } from "@/components/dashboard/pipeline-board";

export const dynamic = "force-dynamic";

const HITL_STATUSES = ["Renvoyé au commercial", "Erreur distance"];

function getKanbanColumn(status: string, nbRelances: number): KanbanColumnKey {
  if (status === "Nouvelle demande" || status === "Erreur distance") return "NOUVEAU";
  if (status === "Devis généré") return "QUALIFIÉ";
  if (status === "Devis envoyé") return nbRelances > 0 ? "RELANCE" : "DEVIS_ENVOYÉ";
  if (status === "Devis accepté") return "GAGNÉ";
  if (status === "Devis refusé") return "PERDU";
  return "HITL";
}

export default async function DashboardPage() {
  const rows = await db
    .select({ lead: leads, prospect: prospects, devis: devis })
    .from(leads)
    .innerJoin(prospects, eq(leads.prospectId, prospects.id))
    .leftJoin(devis, eq(devis.leadId, leads.id))
    .orderBy(desc(leads.createdAt));

  const relanceRows = await db.select().from(relances);
  const relancesByDevisId = new Map<string, number>();
  for (const r of relanceRows) {
    relancesByDevisId.set(r.devisId, (relancesByDevisId.get(r.devisId) ?? 0) + 1);
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
      groupedByLead.set(row.lead.id, {
        lead: row.lead,
        prospect: row.prospect,
        allDevis: row.devis ? [row.devis] : [],
        nbRelances: 0,
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

  const groupedRows = Array.from(groupedByLead.values()) as GroupedRow[];

  // KPIs
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const leadsAujourdhui = groupedRows.filter((r) => new Date(r.lead.createdAt) >= today).length;
  const leads30j = groupedRows.filter((r) => new Date(r.lead.createdAt) >= thirtyDaysAgo).length;
  const leads60to30 = groupedRows.filter((r) => {
    const d = new Date(r.lead.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;
  const leadsEvolution = leads60to30 > 0 ? Math.round(((leads30j - leads60to30) / leads60to30) * 100) : 0;

  const enAttenteHitl = groupedRows.filter((r) => HITL_STATUSES.includes(r.lead.status)).length;
  const withDevis = groupedRows.filter((r) => r.allDevis.filter((d) => d !== null).length > 0).length;
  const qualifAuto = groupedRows.length > 0 ? Math.round((withDevis / groupedRows.length) * 100) : 0;

  const accepted = groupedRows.filter((r) => r.lead.status === "Devis accepté").length;
  const refused = groupedRows.filter((r) => r.lead.status === "Devis refusé").length;
  const sent = groupedRows.filter((r) => r.lead.status === "Devis envoyé").length;
  const closed = accepted + refused + sent;
  const tauxConversion = closed > 0 ? Math.round((accepted / closed) * 100) : 0;

  const accepted30j = groupedRows.filter((r) => r.lead.status === "Devis accepté" && new Date(r.lead.createdAt) >= thirtyDaysAgo).length;
  const closed30j = groupedRows.filter((r) =>
    ["Devis envoyé", "Devis accepté", "Devis refusé"].includes(r.lead.status) && new Date(r.lead.createdAt) >= thirtyDaysAgo
  ).length;
  const accepted60to30 = groupedRows.filter((r) => {
    const d = new Date(r.lead.createdAt);
    return r.lead.status === "Devis accepté" && d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;
  const closed60to30 = groupedRows.filter((r) => {
    const d = new Date(r.lead.createdAt);
    return ["Devis envoyé", "Devis accepté", "Devis refusé"].includes(r.lead.status) && d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;
  const conv30j = closed30j > 0 ? Math.round((accepted30j / closed30j) * 100) : 0;
  const conv60to30 = closed60to30 > 0 ? Math.round((accepted60to30 / closed60to30) * 100) : 0;
  const convEvolution = conv60to30 > 0 ? conv30j - conv60to30 : 0;

  // CA
  const caTotal = groupedRows
    .filter((r) => r.lead.status === "Devis accepté")
    .reduce((sum, r) => {
      const d = r.allDevis.filter((x): x is NonNullable<typeof x> => x !== null).sort((a, b) => b.version - a.version)[0];
      return sum + (d ? parseFloat(d.prixTTC) : 0);
    }, 0);

  const ca30j = groupedRows
    .filter((r) => r.lead.status === "Devis accepté" && new Date(r.lead.createdAt) >= thirtyDaysAgo)
    .reduce((sum, r) => {
      const d = r.allDevis.filter((x): x is NonNullable<typeof x> => x !== null).sort((a, b) => b.version - a.version)[0];
      return sum + (d ? parseFloat(d.prixTTC) : 0);
    }, 0);

  // Répartition statuts pour le camembert
  const statusDistribution = [
    { name: "Nouveau", value: groupedRows.filter((r) => r.lead.status === "Nouvelle demande").length, color: "#60a5fa" },
    { name: "Qualifié", value: groupedRows.filter((r) => r.lead.status === "Devis généré").length, color: "#a3e635" },
    { name: "Envoyé", value: sent, color: "#3b82f6" },
    { name: "Accepté", value: accepted, color: "#22c55e" },
    { name: "Refusé", value: refused, color: "#ef4444" },
    { name: "HITL", value: enAttenteHitl, color: "#f97316" },
  ].filter((s) => s.value > 0);

  // Kanban columns
  const columns: Record<KanbanColumnKey, GroupedRow[]> = {
    NOUVEAU: [], QUALIFIÉ: [], DEVIS_ENVOYÉ: [], RELANCE: [], GAGNÉ: [], PERDU: [], HITL: [],
  };

  for (const row of groupedRows) {
    const col = getKanbanColumn(row.lead.status, row.nbRelances);
    columns[col].push(row);
  }

  return (
    <PipelineBoard
      columns={columns}
      stats={{
        leadsAujourdhui,
        leads30j,
        leadsEvolution,
        delaiMoyen: null,
        qualifAuto,
        enAttenteHitl,
        tauxConversion,
        convEvolution,
        caTotal,
        ca30j,
        totalLeads: groupedRows.length,
        statusDistribution,
      }}
    />
  );
}
