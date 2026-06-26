"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import DevisCreate from "./devis-create";
import DevisPreview from "./devis-preview";

export interface Prospect {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string;
  telephone: string | null;
  societe: string | null;
}

export interface Lead {
  id: string;
  createdAt: Date;
  status: string;
  departVille: string | null;
  arriveeVille: string | null;
  departDate: string | null;
  departHeure: string | null;
  arriveeDate: string | null;
  arriveeHeure: string | null;
  besoin: string | null;
  voyageursMin: number | null;
  voyageursMax: number | null;
  noteCommercial: string | null;
}

export interface Devis {
  id: string;
  reference: string;
  version: number;
  prixHT: string;
  prixTTC: string;
  distanceKm: number;
  coeffSaison: string | null;
  coeffDate: string | null;
  coeffCapacite: string | null;
  marge: string | null;
  ajustementCustom: string | null;
  envoyeLe: Date | null;
  leadId: string;
}

export interface GroupedRow {
  lead: Lead;
  prospect: Prospect;
  allDevis: (Devis | null)[];
  nbRelances: number;
}

export type KanbanColumnKey = "NOUVEAU" | "QUALIFIÉ" | "DEVIS_ENVOYÉ" | "RELANCE" | "GAGNÉ" | "PERDU" | "HITL";

export interface KanbanStats {
  leadsAujourdhui: number;
  leads30j: number;
  leadsEvolution: number;
  delaiMoyen: number | null;
  qualifAuto: number;
  enAttenteHitl: number;
  tauxConversion: number;
  convEvolution: number;
  caTotal: number;
  ca30j: number;
  totalLeads: number;
  statusDistribution: { name: string; value: number; color: string }[];
}

const COLUMN_CONFIG: { key: KanbanColumnKey; label: string; dot: string }[] = [
  { key: "NOUVEAU",      label: "Erreur distance", dot: "bg-red-300" },
  { key: "QUALIFIÉ",     label: "Qualifié",      dot: "bg-lime-400" },
  { key: "DEVIS_ENVOYÉ", label: "Devis envoyé", dot: "bg-blue-500" },
  { key: "RELANCE",      label: "Relance",       dot: "bg-yellow-400" },
  { key: "GAGNÉ",        label: "Gagné",         dot: "bg-green-500" },
  { key: "PERDU",        label: "Perdu",         dot: "bg-red-400" },
  { key: "HITL",         label: "À traiter",     dot: "bg-orange-400" },
];

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function EvoBadge({ value, suffix }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-xs text-gray-400">—</span>;
  const positive = value > 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
      {positive ? "↑" : "↓"} {Math.abs(value)}{suffix ?? "%"}
    </span>
  );
}

function ContactTooltip({ prospect }: { prospect: Prospect }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="truncate text-xs text-gray-400 cursor-default underline decoration-dotted underline-offset-2">
        {prospect.prenom} {prospect.nom}
      </p>
      {showTooltip && (
        <div
          className="absolute left-0 top-full z-30 mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <p
            className="cursor-pointer text-xs text-gray-600 hover:text-blue-500"
            onClick={() => navigator.clipboard.writeText(prospect.email)}
            title="Cliquer pour copier"
          >
            {prospect.email}
          </p>
          {prospect.telephone && (
            <p
              className="cursor-pointer text-xs text-gray-600 hover:text-blue-500"
              onClick={() => navigator.clipboard.writeText(prospect.telephone!)}
              title="Cliquer pour copier"
            >
              {prospect.telephone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineCard({
  row,
  onCreate,
  onPreview,
  columnKey,
}: {
  row: GroupedRow;
  onCreate: () => void;
  onPreview: (devis: Devis) => void;
  columnKey: KanbanColumnKey;
}) {
  const validDevis = row.allDevis.filter((d): d is Devis => d !== null);
  const sorted = [...validDevis].sort((a, b) => a.version - b.version);
  const latest = sorted[sorted.length - 1] ?? null;

  const isHitl = row.lead.status === "Renvoyé au commercial" || row.lead.status === "Erreur distance";
  const isUrgent = (() => {
    if (!row.lead.departDate) return false;
    const jours = Math.ceil((new Date(row.lead.departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return jours >= 0 && jours <= 7;
  })();

  function handleClick() {
    if (validDevis.length === 0) {
      onCreate();
    } else if (latest) {
      onPreview(latest);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md ${isHitl ? "border-orange-200 bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {row.prospect.societe || "—"}
          </p>
          <ContactTooltip prospect={row.prospect} />
        </div>
        {latest && (
          <span className={`shrink-0 text-sm font-bold ${columnKey === "GAGNÉ" ? "text-green-600" : "text-gray-900"}`}>
            {Math.round(parseFloat(latest.prixTTC))} €
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-blue-500">
        {row.lead.departVille} → {row.lead.arriveeVille}
        {(row.lead.voyageursMax ?? row.lead.voyageursMin)
          ? ` · ${row.lead.voyageursMax ?? row.lead.voyageursMin} pax`
          : ""}
      </p>

      {row.lead.departDate && (
        <p className="mt-1 text-xs text-gray-500">
          Départ: {new Date(row.lead.departDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
          {row.lead.departHeure ? ` à ${row.lead.departHeure.replace(":", "h")}` : ""}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-400">{timeAgo(row.lead.createdAt)}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {isUrgent && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Urgent</span>
        )}
        {row.nbRelances > 0 && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            Relancé ({row.nbRelances}x)
          </span>
        )}
        {validDevis.length > 1 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {validDevis.length} devis
          </span>
        )}
      </div>

    </div>
  );
}

export default function PipelineBoard({
  columns,
  stats,
}: {
  columns: Record<KanbanColumnKey, GroupedRow[]>;
  stats: KanbanStats;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createForLead, setCreateForLead] = useState<{ id: string; lead: Lead; prospect: Prospect } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);
  const [previewState, setPreviewState] = useState<{
    devis: Devis;
    leadId: string;
    leadStatus: string;
    leadBesoin: string;
    totalDevis: number;
    allDevis: Devis[];
    devisStatusMap: Record<string, string>;
  } | null>(null);

  const hitlCount = columns.HITL.length + columns.NOUVEAU.length;

  function filterRow(row: GroupedRow): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${row.prospect.prenom ?? ""} ${row.prospect.nom ?? ""}`.toLowerCase().includes(q) ||
      (row.prospect.societe ?? "").toLowerCase().includes(q) ||
      (row.lead.departVille ?? "").toLowerCase().includes(q) ||
      (row.lead.arriveeVille ?? "").toLowerCase().includes(q)
    );
  }

  function openPreview(row: GroupedRow, devis: Devis) {
    const validDevis = row.allDevis.filter((d): d is Devis => d !== null);
    const sorted = validDevis.sort((a, b) => a.version - b.version);
    const latest = sorted[sorted.length - 1];

    const statusMap: Record<string, string> = {};
    for (const d of sorted) {
      if (d.id === latest?.id) {
        statusMap[d.id] = row.lead.status;
      } else if (d.envoyeLe) {
        statusMap[d.id] = "Devis refusé";
      } else {
        statusMap[d.id] = "Devis généré";
      }
    }

    setPreviewState({
      devis,
      leadId: row.lead.id,
      leadStatus: statusMap[devis.id] ?? row.lead.status,
      leadBesoin: row.lead.besoin ?? "aller_simple",
      totalDevis: validDevis.length,
      allDevis: sorted,
      devisStatusMap: statusMap,
    });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-navy-950">N</div>
            <span className="text-base font-bold text-gray-900">NeoTravel</span>
          </a>
          <span className="text-sm text-gray-400">/ Pipeline</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <a href="/" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Accueil
          </a>
        </div>
      </header>

      {/* HITL Alert */}
      {hitlCount > 0 && (
        <div className="flex items-center gap-3 border-b border-orange-200 bg-orange-50 px-6 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">!</div>
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{hitlCount} demande{hitlCount > 1 ? "s" : ""}</span>{" "}
            {hitlCount > 1 ? "nécessitent" : "nécessite"} votre intervention
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3 px-6 py-4">
        {/* Leads */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">Leads aujourd&apos;hui</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-900">{stats.leadsAujourdhui}</p>
            <div className="text-right">
              <p className="text-xs text-gray-400">{stats.leads30j} / 30j</p>
              <EvoBadge value={stats.leadsEvolution} />
            </div>
          </div>
        </div>

        {/* Conversion */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">Taux conversion</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-900">{stats.tauxConversion}%</p>
            <div className="text-right">
              <EvoBadge value={stats.convEvolution} suffix=" pts" />
              <p className="text-xs text-gray-400">vs 30j préc.</p>
            </div>
          </div>
        </div>

        {/* CA */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">CA accepté</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-2xl font-bold text-green-600">{Math.round(stats.caTotal).toLocaleString("fr-FR")} €</p>
            <div className="text-right">
              <p className="text-xs text-gray-400">{Math.round(stats.ca30j).toLocaleString("fr-FR")} € / 30j</p>
            </div>
          </div>
        </div>

        {/* Qualif auto */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">Qualif. automatique</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-900">{stats.qualifAuto}%</p>
            <p className="text-xs text-gray-400">cible ≥ 70%</p>
          </div>
        </div>

        {/* HITL */}
        <div className={`rounded-xl border p-4 shadow-sm ${stats.enAttenteHitl > 0 ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}>
          <p className="text-xs font-medium text-gray-400">En attente HITL</p>
          <div className="mt-1 flex items-end justify-between">
            <p className={`text-3xl font-bold ${stats.enAttenteHitl > 0 ? "text-orange-500" : "text-gray-900"}`}>
              {stats.enAttenteHitl}
            </p>
            <p className="text-xs text-gray-400">à traiter</p>
          </div>
        </div>

        {/* Pie chart — répartition */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-gray-400">Répartition</p>
          <div className="flex items-center gap-2">
            <div className="h-16 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    strokeWidth={0}
                  >
                    {stats.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-0.5">
              {stats.statusDistribution.slice(0, 4).map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] text-gray-500">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {COLUMN_CONFIG.map((col) => {
          const rows = columns[col.key].filter(filterRow).sort((a, b) => {
            const aUrgent = a.lead.departDate && Math.ceil((new Date(a.lead.departDate).getTime() - Date.now()) / 86400000) <= 7 ? 1 : 0;
            const bUrgent = b.lead.departDate && Math.ceil((new Date(b.lead.departDate).getTime() - Date.now()) / 86400000) <= 7 ? 1 : 0;
            return bUrgent - aUrgent;
          });
          return (
            <div key={col.key} className="flex w-[260px] shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {col.label}
                </span>
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {rows.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rows.map((row) => (
                  <PipelineCard
                    key={row.lead.id}
                    row={row}
                    columnKey={col.key}
                    onCreate={() => setCreateForLead({ id: row.lead.id, lead: row.lead, prospect: row.prospect })}
                    onPreview={(devis) => openPreview(row, devis)}
                  />
                ))}
                {rows.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
                    Aucun lead
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {createForLead && (
        <DevisCreate leadId={createForLead.id} lead={createForLead.lead} prospect={createForLead.prospect} onClose={() => setCreateForLead(null)} />
      )}

      {previewState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewState(null)}>
          <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl lg:flex-row" onClick={(e) => e.stopPropagation()}>
            {/* Left — devis navigation + simulator */}
            <div className="flex w-full flex-col border-b border-gray-200 lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
              {/* Nav tabs for multi-devis */}
              {previewState.allDevis.length > 1 && (
                <div className="flex border-b border-gray-200 px-4 pt-3">
                  {previewState.allDevis.map((d) => (
                    <button
                      key={d.id}
                      onClick={() =>
                        setPreviewState((prev) =>
                          prev ? { ...prev, devis: d, leadStatus: prev.devisStatusMap[d.id] ?? prev.leadStatus } : null,
                        )
                      }
                      className={`px-3 pb-2 text-xs font-medium border-b-2 transition-colors ${
                        d.id === previewState.devis.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Devis N°{d.version}
                    </button>
                  ))}
                </div>
              )}

              {/* Embed the existing DevisPreview simulator inside */}
              <div className="flex-1 overflow-y-auto">
                <DevisPreview
                  key={previewState.devis.id}
                  devisId={previewState.devis.id}
                  leadId={previewState.leadId}
                  devisData={previewState.devis}
                  totalDevis={previewState.totalDevis}
                  leadStatus={previewState.leadStatus}
                  leadBesoin={previewState.leadBesoin}
                  onClose={() => { setPreviewState(null); router.refresh(); }}
                  onDevisCreated={(newDevis) => {
                    const newDevisData: Devis = {
                      id: newDevis.id,
                      reference: newDevis.reference,
                      version: newDevis.version,
                      prixHT: newDevis.prixHT.toString(),
                      prixTTC: newDevis.prixTTC.toString(),
                      distanceKm: previewState.devis.distanceKm,
                      coeffSaison: null,
                      coeffDate: null,
                      coeffCapacite: null,
                      marge: null,
                      ajustementCustom: null,
                      envoyeLe: null,
                      leadId: previewState.leadId,
                    };
                    setPreviewState((prev) => {
                      if (!prev) return null;
                      const newStatusMap = { ...prev.devisStatusMap };
                      newStatusMap[newDevis.id] = "Devis généré";
                      return {
                        ...prev,
                        devis: newDevisData,
                        leadStatus: "Devis généré",
                        totalDevis: prev.totalDevis + 1,
                        allDevis: [...prev.allDevis, newDevisData],
                        devisStatusMap: newStatusMap,
                      };
                    });
                    router.refresh();
                  }}
                  embedded
                />
              </div>
            </div>

            {/* Right — PDF */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Aperçu PDF — {previewState.devis.reference}
                </h2>
                <button
                  onClick={() => setPreviewState(null)}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  key={previewState.devis.id}
                  src={`/api/devis/${previewState.devis.id}/pdf`}
                  className="h-full w-full"
                  title="Aperçu du devis"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
