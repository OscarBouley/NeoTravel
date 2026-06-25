"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import DevisCreate from "./devis-create";

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

export type KanbanColumnKey = "NOUVEAU" | "QUALIFIÉ" | "DEVIS_ENVOYÉ" | "RELANCE" | "GAGNÉ" | "HITL";

export interface KanbanStats {
  leadsAujourdhui: number;
  delaiMoyen: number | null;
  qualifAuto: number;
  enAttenteHitl: number;
  tauxConversion: number;
}

const COLUMN_CONFIG: { key: KanbanColumnKey; label: string; dot: string }[] = [
  { key: "NOUVEAU",     label: "NOUVEAU",          dot: "bg-blue-400" },
  { key: "QUALIFIÉ",    label: "QUALIFIÉ",          dot: "bg-lime-400" },
  { key: "DEVIS_ENVOYÉ",label: "DEVIS ENVOYÉ",     dot: "bg-blue-500" },
  { key: "RELANCE",     label: "RELANCE",           dot: "bg-yellow-400" },
  { key: "GAGNÉ",       label: "GAGNÉ",             dot: "bg-green-500" },
  { key: "HITL",        label: "À TRAITER · HITL",  dot: "bg-orange-400" },
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

function PipelineCard({
  row,
  onCreate,
}: {
  row: GroupedRow;
  onCreate: () => void;
}) {
  const router = useRouter();
  const validDevis = row.allDevis.filter((d): d is Devis => d !== null);
  const latest = [...validDevis].sort((a, b) => a.version - b.version)[validDevis.length - 1] ?? null;

  const isHitl = row.lead.status === "Renvoyé au commercial" || row.lead.status === "Erreur distance";
  const isHorsZone = row.lead.status === "Erreur distance";
  const isGros = (row.lead.voyageursMax ?? row.lead.voyageursMin ?? 0) > 85;
  const isUrgent = (() => {
    if (!row.lead.departDate) return false;
    const dep = new Date(row.lead.departDate);
    const jours = Math.ceil((dep.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return jours >= 0 && jours <= 7;
  })();

  function handleClick() {
    if (validDevis.length === 0) {
      onCreate();
    } else {
      router.push(`/dashboard/leads/${row.lead.id}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md ${isHitl ? "border-orange-200 bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {row.prospect.prenom} {row.prospect.nom}
          </p>
          {row.prospect.societe && (
            <p className="truncate text-xs text-gray-400">{row.prospect.societe}</p>
          )}
        </div>
        {latest && (
          <span className="shrink-0 text-sm font-bold text-gray-900">
            {Math.round(parseFloat(latest.prixTTC)).toLocaleString("fr-FR")}€
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-blue-500">
        {row.lead.departVille} → {row.lead.arriveeVille}
        {(row.lead.voyageursMax ?? row.lead.voyageursMin)
          ? ` · ${row.lead.voyageursMax ?? row.lead.voyageursMin} pax`
          : ""}
      </p>

      <p className="mt-1 text-xs text-gray-400">{timeAgo(row.lead.createdAt)}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {isUrgent && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            urgent
          </span>
        )}
        {row.nbRelances > 0 && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            relance {row.nbRelances}
          </span>
        )}
        {isGros && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
            &gt; 85 pax
          </span>
        )}
        {isHorsZone && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            hors zone
          </span>
        )}
        {isHitl && !isHorsZone && !isGros && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
            demande remise
          </span>
        )}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  href,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-navy-800 text-navy-100"
          : "text-navy-400 hover:bg-navy-800/50 hover:text-navy-100"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

function KpiCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-[110px]">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-orange-500" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sub}</p>
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
  const [search, setSearch] = useState("");
  const [createForLead, setCreateForLead] = useState<string | null>(null);

  const hitlCount = columns.HITL.length;

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-navy-800 bg-navy-950">
        <div className="border-b border-navy-800 p-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-navy-950">
              N
            </div>
            <span className="text-base font-bold text-navy-100">NeoTravel</span>
          </a>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          <NavItem
            active
            href="/dashboard"
            label="Pipeline"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 0 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
              </svg>
            }
          />
          <NavItem
            href="/dashboard"
            label="Leads"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            }
          />
          <NavItem
            href="/dashboard"
            label="Devis"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            }
          />
          <NavItem
            href="/dashboard"
            label="Relances"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            }
          />
          <div className="my-2 border-t border-navy-800" />
          <NavItem
            href="/dashboard"
            label="Tableau de bord"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            }
          />
          <NavItem
            href="/dashboard"
            label="Réglages"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
          />
        </nav>

        <div className="border-t border-navy-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-navy-100">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-navy-100">Admin</p>
              <p className="text-xs text-navy-400">Commercial</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <h1 className="text-lg font-bold text-gray-900">Pipeline commercial</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un lead..."
                className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              Aujourd&apos;hui
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* HITL Alert */}
        {hitlCount > 0 && (
          <div className="flex items-center gap-3 border-b border-orange-200 bg-orange-50 px-6 py-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              !
            </div>
            <p className="text-sm text-orange-800">
              <span className="font-semibold">
                {hitlCount} demande{hitlCount > 1 ? "s" : ""}
              </span>{" "}
              nécessitent votre intervention — négociation, hors zone, &gt; 85 passagers.
            </p>
            <a
              href="/dashboard"
              className="ml-auto shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
            >
              Traiter →
            </a>
          </div>
        )}

        {/* KPIs */}
        <div className="flex items-center gap-6 border-b border-gray-200 bg-white px-6 py-3">
          <KpiCell
            label="Leads aujourd'hui"
            value={stats.leadsAujourdhui.toString()}
            sub="demandes reçues"
          />
          <div className="h-10 w-px bg-gray-100" />
          <KpiCell
            label="Délai lead→devis"
            value={stats.delaiMoyen !== null ? `${stats.delaiMoyen} min` : "—"}
            sub="cible < 5 min"
          />
          <div className="h-10 w-px bg-gray-100" />
          <KpiCell
            label="Qualif. auto"
            value={`${stats.qualifAuto}%`}
            sub="cible ≥ 70%"
          />
          <div className="h-10 w-px bg-gray-100" />
          <KpiCell
            label="En attente HITL"
            value={stats.enAttenteHitl.toString()}
            sub="à traiter"
            highlight={stats.enAttenteHitl > 0}
          />
          <div className="h-10 w-px bg-gray-100" />
          <KpiCell
            label="Taux transfo."
            value={`${stats.tauxConversion}%`}
            sub="leads → acceptés"
          />
        </div>

        {/* Kanban */}
        <div className="flex flex-1 gap-4 overflow-x-auto p-5 pb-6">
          {COLUMN_CONFIG.map((col) => {
            const rows = columns[col.key].filter(filterRow);
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
                <div className="flex flex-col gap-2.5 overflow-y-auto">
                  {rows.map((row) => (
                    <PipelineCard
                      key={row.lead.id}
                      row={row}
                      onCreate={() => setCreateForLead(row.lead.id)}
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
      </div>

      {createForLead && (
        <DevisCreate
          leadId={createForLead}
          onClose={() => setCreateForLead(null)}
        />
      )}
    </div>
  );
}
