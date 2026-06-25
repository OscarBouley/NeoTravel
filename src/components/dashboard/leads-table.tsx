"use client";

import { useState } from "react";
import DevisPreview from "./devis-preview";

interface Prospect {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string;
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
}

interface Devis {
  id: string;
  reference: string;
  prixHT: string;
  prixTTC: string;
  distanceKm: number;
  envoyeLe: Date | null;
}

interface Row {
  lead: Lead;
  prospect: Prospect;
  devis: Devis | null;
}

const BESOIN_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "A/R",
  circuit: "Circuit",
};

const STATUS_COLORS: Record<string, string> = {
  "Nouvelle demande": "bg-navy-400/20 text-navy-400",
  "Devis généré": "bg-yellow-400/20 text-yellow-400",
  "Devis envoyé": "bg-lime-400/20 text-lime-400",
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

export default function LeadsTable({ rows }: { rows: Row[] }) {
  const [previewDevisId, setPreviewDevisId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  async function handleEnvoyer(devisId: string) {
    setSending(devisId);
    try {
      const res = await fetch(`/api/devis/${devisId}/envoyer`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'envoi");
        return;
      }
      window.location.reload();
    } catch {
      alert("Erreur réseau");
    } finally {
      setSending(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-navy-700/50 bg-navy-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700/50 text-xs uppercase tracking-wider text-navy-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Trajet</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Prix TTC</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.lead.id}-${row.devis?.id ?? "no-devis"}`}
                className="border-b border-navy-700/30 hover:bg-navy-800/50"
              >
                <td className="px-4 py-3 text-navy-400">
                  {formatDate(row.lead.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {row.prospect.prenom} {row.prospect.nom}
                  </div>
                  <div className="text-xs text-navy-400">
                    {row.prospect.email}
                  </div>
                  {row.prospect.telephone && (
                    <div className="text-xs text-navy-400">
                      {row.prospect.telephone}
                    </div>
                  )}
                  {row.prospect.societe && (
                    <div className="text-xs text-navy-400">
                      {row.prospect.societe}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    {row.lead.departVille} → {row.lead.arriveeVille}
                  </div>
                  <div className="text-xs text-navy-400">
                    {BESOIN_LABELS[row.lead.besoin ?? ""] ?? row.lead.besoin}
                    {row.devis && ` · ${row.devis.distanceKm} km`}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>Dep: {formatDate(row.lead.departDate)} {row.lead.departHeure ?? ""}</div>
                  <div>Arr: {formatDate(row.lead.arriveeDate)} {row.lead.arriveeHeure ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.lead.voyageursMax ?? row.lead.voyageursMin ?? "—"}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {row.devis
                    ? `${Math.round(parseFloat(row.devis.prixTTC))} €`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[row.lead.status] ?? "bg-navy-700 text-navy-400"}`}
                  >
                    {row.lead.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {row.devis && (
                      <button
                        onClick={() => setPreviewDevisId(row.devis!.id)}
                        className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-medium text-navy-100 transition-colors hover:bg-navy-700"
                      >
                        Voir
                      </button>
                    )}
                    {row.devis && row.lead.status !== "Devis envoyé" && (
                      <button
                        onClick={() => handleEnvoyer(row.devis!.id)}
                        disabled={sending === row.devis.id}
                        className="rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:opacity-50"
                      >
                        {sending === row.devis.id ? "Envoi..." : "Envoyer"}
                      </button>
                    )}
                    {row.lead.status === "Devis envoyé" && (
                      <span className="px-1 text-xs text-lime-400">✓ Envoyé</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-navy-400">
                  Aucune demande pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewDevisId && (
        <DevisPreview
          devisId={previewDevisId}
          onClose={() => setPreviewDevisId(null)}
        />
      )}
    </>
  );
}
