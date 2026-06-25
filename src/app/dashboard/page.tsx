import { db } from "@/lib/db";
import { leads, prospects, devis, relances } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import PipelineBoard, { type KanbanColumnKey, type GroupedRow } from "@/components/dashboard/pipeline-board";

export const dynamic = "force-dynamic";

const HITL_STATUSES = ["Renvoyé au commercial", "Erreur distance"];

function getKanbanColumn(status: string, nbRelances: number): KanbanColumnKey {
  if (status === "Nouvelle demande") return "NOUVEAU";
  if (status === "Devis généré") return "QUALIFIÉ";
  if (status === "Devis envoyé") return nbRelances > 0 ? "RELANCE" : "DEVIS_ENVOYÉ";
  if (status === "Devis accepté") return "GAGNÉ";
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const leadsAujourdhui = groupedRows.filter((r) => new Date(r.lead.createdAt) >= today).length;
  const enAttenteHitl = groupedRows.filter((r) => HITL_STATUSES.includes(r.lead.status)).length;
  const withDevis = groupedRows.filter((r) => r.allDevis.length > 0).length;
  const qualifAuto = groupedRows.length > 0 ? Math.round((withDevis / groupedRows.length) * 100) : 0;
  const accepted = groupedRows.filter((r) => r.lead.status === "Devis accepté").length;
  const closed = groupedRows.filter((r) =>
    ["Devis envoyé", "Devis accepté", "Devis refusé"].includes(r.lead.status)
  ).length;
  const tauxConversion = closed > 0 ? Math.round((accepted / closed) * 100) : 0;

  // Group into Kanban columns (skip refused leads)
  const columns: Record<KanbanColumnKey, GroupedRow[]> = {
    NOUVEAU: [], QUALIFIÉ: [], DEVIS_ENVOYÉ: [], RELANCE: [], GAGNÉ: [], HITL: [],
  };

  for (const row of groupedRows) {
    if (row.lead.status === "Devis refusé") continue;
    const col = getKanbanColumn(row.lead.status, row.nbRelances);
    columns[col].push(row);
  }

  return (
    <PipelineBoard
      columns={columns}
      stats={{ leadsAujourdhui, delaiMoyen: null, qualifAuto, enAttenteHitl, tauxConversion }}
    />
  );
}
