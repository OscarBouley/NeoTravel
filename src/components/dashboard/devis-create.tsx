"use client";

import { useEffect, useState } from "react";

interface DevisCreateProps {
  leadId: string;
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

const selectClass =
  "w-full rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none";

export default function DevisCreate({ leadId, onClose }: DevisCreateProps) {
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [marge, setMarge] = useState(15);
  const [coeffSaison, setCoeffSaison] = useState(0);
  const [coeffDate, setCoeffDate] = useState(0);
  const [coeffCapacite, setCoeffCapacite] = useState(0);
  const [saving, setSaving] = useState(false);

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
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-100">
            Créer un devis
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-navy-400">
              Distance (km)
            </label>
            <input
              type="number"
              min={1}
              value={distanceKm || ""}
              onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
              placeholder="Ex: 350"
              className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-navy-100 placeholder:text-navy-400/50 focus:border-lime-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-navy-400">
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
            <label className="mb-1 block text-xs text-navy-400">
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
            <label className="mb-1 block text-xs text-navy-400">
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
            <label className="mb-1 block text-xs text-navy-400">
              Marge (%)
            </label>
            <input
              type="number"
              value={marge}
              onChange={(e) => setMarge(parseFloat(e.target.value) || 0)}
              className="w-20 rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleCreer}
          disabled={saving || !distanceKm}
          className="mt-5 w-full rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:opacity-50"
        >
          {saving ? "Création..." : "Créer le devis N°1"}
        </button>
      </div>
    </div>
  );
}
