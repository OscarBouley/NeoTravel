"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, Prospect } from "./pipeline-board";

interface DevisCreateProps {
  leadId: string;
  lead?: Lead;
  prospect?: Prospect;
  onClose: () => void;
}

const SAISON_OPTIONS = [
  { label: "Basse (-7%) — Nov, Jan, Fév, Août", value: -0.07 },
  { label: "Moyenne (0%) — Déc, Oct, Sep", value: 0 },
  { label: "Haute (+10%) — Mar, Avr, Juil", value: 0.1 },
  { label: "Très haute (+15%) — Mai, Juin", value: 0.15 },
];

const DATE_OPTIONS = [
  { label: "Prioritaire (+10%) — ≤14j", value: 0.1 },
  { label: "Urgent (+5%) — 14-30j", value: 0.05 },
  { label: "Normal (-5%) — 30-90j", value: -0.05 },
  { label: "3 mois+ (-10%) — >90j", value: -0.1 },
];

const CAPACITE_OPTIONS = [
  { label: "≤19 pax (-5%)", value: -0.05 },
  { label: "20-53 pax (0%)", value: 0 },
  { label: "54-63 pax (+15%)", value: 0.15 },
  { label: "64-67 pax (+20%)", value: 0.2 },
  { label: "68-85 pax (+40%)", value: 0.4 },
];

const MOIS_FR = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

const COEFF_SAISONNALITE: Record<string, number> = {
  janvier: -0.07, fevrier: -0.07, mars: 0.1, avril: 0.1,
  mai: 0.15, juin: 0.15, juillet: 0.1, aout: -0.07,
  septembre: 0, octobre: 0, novembre: -0.07, decembre: 0,
};

const COEFF_CAPACITE = [
  { max: 19, coeff: -0.05 },
  { max: 53, coeff: 0 },
  { max: 63, coeff: 0.15 },
  { max: 67, coeff: 0.2 },
  { max: 85, coeff: 0.4 },
];

function autoDetectSaison(departDate: string): number {
  const mois = new Date(departDate).getMonth();
  return COEFF_SAISONNALITE[MOIS_FR[mois]] ?? 0;
}

function autoDetectDate(departDate: string): number {
  const jours = Math.floor((new Date(departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (jours <= 14) return 0.1;
  if (jours <= 30) return 0.05;
  if (jours <= 90) return -0.05;
  return -0.1;
}

function autoDetectCapacite(pax: number): number {
  for (const t of COEFF_CAPACITE) {
    if (pax <= t.max) return t.coeff;
  }
  return 0;
}

const BESOIN_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "Aller-retour",
  circuit: "Circuit",
};

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function DevisCreate({ leadId, lead, prospect, onClose }: DevisCreateProps) {
  const pax = lead?.voyageursMax ?? lead?.voyageursMin ?? 0;

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [marge, setMarge] = useState(15);
  const [coeffSaison, setCoeffSaison] = useState(() =>
    lead?.departDate ? autoDetectSaison(lead.departDate) : 0,
  );
  const [coeffDate, setCoeffDate] = useState(() =>
    lead?.departDate ? autoDetectDate(lead.departDate) : 0,
  );
  const [coeffCapacite, setCoeffCapacite] = useState(() =>
    pax > 0 ? autoDetectCapacite(pax) : 0,
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleCreer() {
    if (!distanceKm || distanceKm <= 0) {
      alert("Veuillez saisir la distance en km");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/devis-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceKm,
          coeffSaison,
          coeffDate,
          coeffCapacite,
          marge: marge / 100,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — form fields (new devis) */}
        <div className="flex-1 border-r border-gray-100 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Créer un devis
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Distance (km)
              </label>
              <input
                type="number"
                min={1}
                value={distanceKm || ""}
                onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
                placeholder="Ex: 350"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Saisonnalité
              </label>
              <select
                value={coeffSaison}
                onChange={(e) => setCoeffSaison(parseFloat(e.target.value))}
                className={selectClass}
              >
                {SAISON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Délai demande / départ
              </label>
              <select
                value={coeffDate}
                onChange={(e) => setCoeffDate(parseFloat(e.target.value))}
                className={selectClass}
              >
                {DATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Capacité
              </label>
              <select
                value={coeffCapacite}
                onChange={(e) => setCoeffCapacite(parseFloat(e.target.value))}
                className={selectClass}
              >
                {CAPACITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Marge (%)
              </label>
              <input
                type="number"
                min="0"
                value={marge}
                onChange={(e) => setMarge(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCreer}
            disabled={saving || !distanceKm}
            className="mt-6 w-full rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer le devis N°1"}
          </button>
        </div>

        {/* Right — existing lead/prospect info */}
        {lead && prospect && (
          <div className="w-[300px] shrink-0 bg-gray-50 p-6 rounded-r-2xl">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Données de la demande
            </h3>

            <div className="space-y-4">
              <section>
                <p className="mb-2 text-xs font-semibold text-gray-500">Client</p>
                <div className="space-y-1.5">
                  <InfoLine label="Nom" value={`${prospect.prenom ?? ""} ${prospect.nom ?? ""}`.trim() || "—"} />
                  <InfoLine label="Email" value={prospect.email} />
                  {prospect.telephone && <InfoLine label="Tél" value={prospect.telephone} />}
                  {prospect.societe && <InfoLine label="Société" value={prospect.societe} />}
                </div>
              </section>

              <div className="border-t border-gray-200" />

              <section>
                <p className="mb-2 text-xs font-semibold text-gray-500">Votre voyage</p>
                <div className="space-y-1.5">
                  <InfoLine label="Type" value={BESOIN_LABELS[lead.besoin ?? ""] ?? lead.besoin ?? "—"} />
                  <InfoLine label="Départ" value={lead.departVille ?? "—"} />
                  <InfoLine label="Arrivée" value={lead.arriveeVille ?? "—"} />
                  <InfoLine
                    label="Date départ"
                    value={lead.departDate ? `${formatDate(lead.departDate)}${lead.departHeure ? ` à ${lead.departHeure}` : ""}` : "—"}
                  />
                  <InfoLine
                    label="Retour estimé"
                    value={lead.arriveeDate ? `${formatDate(lead.arriveeDate)}${lead.arriveeHeure ? ` à ~${lead.arriveeHeure}` : ""}` : "—"}
                  />
                  <InfoLine label="Passagers" value={pax ? `${pax} pax` : "—"} />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-700 text-right">{value}</span>
    </div>
  );
}
