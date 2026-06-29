"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DevisPreview from "./devis-preview";
import DevisCreate from "./devis-create";

interface Prospect {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  societe: string | null;
}

interface Lead {
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

interface Devis {
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

interface GroupedRow {
  lead: Lead;
  prospect: Prospect;
  allDevis: (Devis | null)[];
  nbRelances: number;
}

const BESOIN_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "A/R",
  circuit: "Circuit",
};

const STATUS_COLORS: Record<string, string> = {
  "Nouvelle demande": "bg-navy-400/20 text-navy-400",
  "Devis généré": "bg-yellow-400/20 text-yellow-400",
  "Devis envoyé": "bg-blue-400/20 text-blue-400",
  "Devis accepté": "bg-lime-400/20 text-lime-400",
  "Devis refusé": "bg-red-400/20 text-red-400",
  "Renvoyé au commercial": "bg-orange-400/20 text-orange-400",
  "Erreur distance": "bg-red-400/20 text-red-400",
};

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatHeure(h: string | null): string {
  if (!h) return "";
  const parts = h.split(":");
  const hh = parseInt(parts[0], 10);
  const mm = parts[1] ?? "00";
  return `${hh}h${mm}`;
}

function NoteCell({ leadId, initial }: { leadId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (text: string) => {
      fetch(`/api/leads/${leadId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
      }).catch(() => {});
    },
    [leadId],
  );

  function handleChange(text: string) {
    setValue(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 500);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <textarea
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Note..."
      rows={2}
      className="w-full min-w-[120px] resize-none border border-navy-700/50 bg-transparent px-2 py-2 text-xs text-navy-400 placeholder:text-navy-700 focus:border-lime-400 focus:text-navy-100 focus:outline-none"
    />
  );
}

export default function LeadsTable({ rows }: { rows: GroupedRow[] }) {
  const [previewDevis, setPreviewDevis] = useState<{
    devis: Devis;
    leadId: string;
    totalDevis: number;
  } | null>(null);
  const [createForLead, setCreateForLead] = useState<string | null>(null);

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-navy-700/50 bg-navy-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700/50 text-xs uppercase tracking-wider text-navy-400">
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Prospect</th>
              <th className="px-3 py-3">Trajet</th>
              <th className="px-3 py-3">Dates</th>
              <th className="px-3 py-3">Pax</th>
              <th className="px-3 py-3">Dernier prix</th>
              <th className="px-3 py-3">Note</th>
              <th className="px-3 py-3">Relances</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3">Devis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const validDevis = row.allDevis.filter(
                (d): d is Devis => d !== null,
              );
              const sorted = [...validDevis].sort(
                (a, b) => a.version - b.version,
              );
              const latest = sorted[sorted.length - 1] ?? null;
              const distance = latest?.distanceKm;

              return (
                <tr
                  key={row.lead.id}
                  className="border-b border-navy-700/30 hover:bg-navy-800/50"
                >
                  <td className="px-3 py-3 text-xs text-navy-400">
                    {formatDate(row.lead.createdAt)}
                  </td>
                  <td className="px-3 py-3 group/prospect relative">
                    <div className="font-medium text-sm cursor-default">
                      {row.prospect.prenom} {row.prospect.nom}
                    </div>
                    <div className="absolute left-3 top-full z-10 hidden rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 shadow-xl group-hover/prospect:block">
                      {row.prospect.email && <div className="text-xs text-navy-400">{row.prospect.email}</div>}
                      {row.prospect.telephone && (
                        <div className="text-xs text-navy-400">{row.prospect.telephone}</div>
                      )}
                      {row.prospect.societe && (
                        <div className="text-xs text-navy-400">{row.prospect.societe}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">
                      {row.lead.departVille} → {row.lead.arriveeVille}
                    </div>
                    <div className="text-xs text-navy-400">
                      {BESOIN_LABELS[row.lead.besoin ?? ""] ??
                        row.lead.besoin}
                      {distance ? ` · ${distance} km` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>
                      Dep: {formatDate(row.lead.departDate)}{" "}
                      {formatHeure(row.lead.departHeure)}
                    </div>
                    <div>
                      Arr: {formatDate(row.lead.arriveeDate)}{" "}
                      {row.lead.arriveeHeure ? `~${formatHeure(row.lead.arriveeHeure)}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm">
                    {row.lead.voyageursMax ??
                      row.lead.voyageursMin ??
                      "—"}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold">
                    {latest
                      ? `${Math.round(parseFloat(latest.prixTTC))} €`
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <NoteCell leadId={row.lead.id} initial={row.lead.noteCommercial} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      {row.nbRelances > 0 && (
                        <span className="text-xs text-navy-400">
                          {row.nbRelances} relance
                          {row.nbRelances > 1 ? "s" : ""}
                        </span>
                      )}
                      {(() => {
                        if (!row.lead.departDate) return null;
                        const dep = new Date(row.lead.departDate);
                        const now = new Date();
                        const jours = Math.ceil(
                          (dep.getTime() - now.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        if (
                          jours <= 7 &&
                          jours >= 0 &&
                          row.lead.status !== "Devis accepté" &&
                          row.lead.status !== "Devis refusé"
                        ) {
                          return (
                            <span className="inline-block rounded-full bg-red-400/20 px-2 py-0.5 text-xs font-medium text-red-400">
                              Urgent J-{jours}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[row.lead.status] ?? "bg-navy-700 text-navy-400"}`}
                    >
                      {row.lead.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {sorted.map((d) => (
                        <button
                          key={d.id}
                          onClick={() =>
                            setPreviewDevis({
                              devis: d,
                              leadId: row.lead.id,
                              totalDevis: sorted.length,
                            })
                          }
                          className="rounded-lg bg-navy-800 px-2.5 py-1.5 text-xs font-medium text-navy-100 transition-colors hover:bg-navy-700 whitespace-nowrap"
                        >
                          Voir devis N°{d.version}
                        </button>
                      ))}
                      {sorted.length === 0 && (
                        <button
                          onClick={() =>
                            setCreateForLead(row.lead.id)
                          }
                          className="rounded-lg bg-lime-400 px-2.5 py-1.5 text-xs font-bold text-navy-950 transition-colors hover:bg-lime-300 whitespace-nowrap"
                        >
                          Créer un devis
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-navy-400"
                >
                  Aucune demande pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewDevis && (
        <DevisPreview
          devisId={previewDevis.devis.id}
          leadId={previewDevis.leadId}
          devisData={previewDevis.devis}
          totalDevis={previewDevis.totalDevis}
          onClose={() => setPreviewDevis(null)}
        />
      )}

      {createForLead && (
        <DevisCreate
          leadId={createForLead}
          onClose={() => setCreateForLead(null)}
        />
      )}
    </>
  );
}
