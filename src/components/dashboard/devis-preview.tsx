"use client";

import { useEffect, useState } from "react";

interface DevisData {
  id: string;
  leadId: string;
  reference: string;
  version: number;
  distanceKm: number;
  prixHT: string;
  prixTTC: string;
  coeffSaison: string | null;
  coeffDate: string | null;
  coeffCapacite: string | null;
  marge: string | null;
  ajustementCustom: string | null;
  envoyeLe: Date | null;
}

interface DevisPreviewProps {
  devisId: string;
  leadId: string;
  devisData: DevisData;
  totalDevis: number;
  onClose: () => void;
}

const TVA = 0.1;

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

function getPrixBaseFromDistance(distanceKm: number): number {
  const grille: Record<number, number> = {
    10: 250, 20: 250, 30: 250, 40: 320, 50: 350,
    60: 390, 70: 430, 80: 500, 90: 540, 100: 580,
    110: 620, 120: 660, 130: 700, 140: 740, 150: 780,
    160: 820, 170: 860, 180: 900,
  };
  const paliers = Object.keys(grille).map(Number).sort((a, b) => a - b);
  for (const p of paliers) {
    if (distanceKm <= p) return grille[p];
  }
  return distanceKm * 2 * 2.5;
}

const selectClass =
  "w-full rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none";

export default function DevisPreview({
  devisId,
  leadId,
  devisData,
  totalDevis,
  onClose,
}: DevisPreviewProps) {
  const distanceKm = devisData.distanceKm;
  const prixBase = getPrixBaseFromDistance(distanceKm);
  const origPrixHT = parseFloat(devisData.prixHT);
  const multiplicateur = origPrixHT > prixBase * 1.5 * 1.5 ? 2 : 1;

  const [marge, setMarge] = useState(parseFloat(devisData.marge ?? "0.15"));
  const [coeffSaison, setCoeffSaison] = useState(
    parseFloat(devisData.coeffSaison ?? "0"),
  );
  const [coeffDate, setCoeffDate] = useState(
    parseFloat(devisData.coeffDate ?? "0"),
  );
  const [coeffCapacite, setCoeffCapacite] = useState(
    parseFloat(devisData.coeffCapacite ?? "0"),
  );
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState(0);
  const [customMode, setCustomMode] = useState<"pct" | "eur">("pct");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const [currentDevisId, setCurrentDevisId] = useState(devisId);
  const [currentVersion, setCurrentVersion] = useState(devisData.version);
  const [nextVersion, setNextVersion] = useState(totalDevis + 1);
  const [devisEnvoye, setDevisEnvoye] = useState(!!devisData.envoyeLe);

  const prixApresBase = prixBase * multiplicateur;
  const prixApresMarge = prixApresBase * (1 + marge);
  const prixApresSaison = prixApresMarge * (1 + coeffSaison);
  const prixApresDate = prixApresSaison * (1 + coeffDate);
  const prixApresCapacite = prixApresDate * (1 + coeffCapacite);

  const customAjustement =
    customMode === "pct" ? -(Math.abs(customValue) / 100) : 0;
  const customEurAjustement =
    customMode === "eur" ? -Math.abs(customValue) : 0;

  const prixHT =
    prixApresCapacite * (1 + customAjustement) + customEurAjustement;
  const prixTTC = prixHT * (1 + TVA);

  const steps = [
    {
      label: `Prix base (${distanceKm} km${multiplicateur === 2 ? " × A/R" : ""})`,
      montant: prixApresBase,
      impact: null as number | null,
    },
    {
      label: `Marge (${Math.round(marge * 100)}%)`,
      montant: prixApresMarge,
      impact: prixApresMarge - prixApresBase,
    },
    {
      label: `Saisonnalité (${coeffSaison >= 0 ? "+" : ""}${Math.round(coeffSaison * 100)}%)`,
      montant: prixApresSaison,
      impact: prixApresSaison - prixApresMarge,
    },
    {
      label: `Délai demande (${coeffDate >= 0 ? "+" : ""}${Math.round(coeffDate * 100)}%)`,
      montant: prixApresDate,
      impact: prixApresDate - prixApresSaison,
    },
    {
      label: `Capacité (${coeffCapacite >= 0 ? "+" : ""}${Math.round(coeffCapacite * 100)}%)`,
      montant: prixApresCapacite,
      impact: prixApresCapacite - prixApresDate,
    },
  ];

  if (customValue !== 0 && customLabel) {
    steps.push({
      label: `${customLabel} (${customMode === "pct" ? `-${Math.abs(customValue)}%` : `-${Math.abs(customValue)}€`})`,
      montant: prixHT,
      impact: prixHT - prixApresCapacite,
    });
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleCreerNouveau() {
    setSaving(true);
    try {
      const ajustement =
        customMode === "pct" && customValue ? -(Math.abs(customValue) / 100) : undefined;

      const res = await fetch(`/api/leads/${leadId}/devis-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coeffSaison,
          coeffDate,
          coeffCapacite,
          marge,
          ajustementCustom: ajustement,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur");
        return;
      }
      const data = await res.json();
      setCurrentDevisId(data.devis.id);
      setCurrentVersion(data.devis.version);
      setNextVersion(data.devis.version + 1);
      setDevisEnvoye(false);
      setPdfVersion((v) => v + 1);
      alert(`Devis N°${data.devis.version} créé (${data.devis.reference})`);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnvoyer() {
    setSending(true);
    try {
      const res = await fetch(`/api/devis/${currentDevisId}/envoyer`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur");
        return;
      }
      alert("Devis envoyé par email !");
      window.location.reload();
    } finally {
      setSending(false);
    }
  }

  async function handleSupprimer() {
    if (!confirm("Supprimer ce devis ?")) return;
    const res = await fetch(`/api/devis/${currentDevisId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur");
      return;
    }
    window.location.reload();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-navy-700/50 bg-navy-900 shadow-2xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — Simulateur */}
        <div className="flex w-full flex-col overflow-y-auto border-b border-navy-700/50 p-5 lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy-100">
              Devis N°{currentVersion} — {devisData.reference}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-100 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Coefficients */}
          <div className="space-y-3">
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-navy-400">
                Capacité
              </label>
              <select
                value={coeffCapacite}
                onChange={(e) =>
                  setCoeffCapacite(parseFloat(e.target.value))
                }
                className={selectClass}
              >
                {CAPACITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-navy-400">
                Marge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={Math.round(marge * 100)}
                  onChange={(e) =>
                    setMarge(parseFloat(e.target.value) / 100)
                  }
                  className="w-20 rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none"
                />
                <span className="text-xs text-navy-400">%</span>
              </div>
            </div>

            {/* Custom criterion */}
            <div className="border-t border-navy-700/50 pt-3">
              <label className="mb-1 block text-xs text-navy-400">
                Remise personnalisée
              </label>
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Ex: Remise fidélité, Supplément nuit..."
                className="mb-2 w-full rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 placeholder:text-navy-400/50 focus:border-lime-400 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) =>
                    setCustomValue(parseFloat(e.target.value) || 0)
                  }
                  className="w-20 rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none"
                />
                <select
                  value={customMode}
                  onChange={(e) =>
                    setCustomMode(e.target.value as "pct" | "eur")
                  }
                  className="rounded-lg border border-navy-700 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 focus:border-lime-400 focus:outline-none"
                >
                  <option value="pct">%</option>
                  <option value="eur">€</option>
                </select>
              </div>
            </div>
          </div>

          {/* Résumé d'impact */}
          <div className="mt-4 rounded-lg bg-navy-800 p-3">
            <p className="mb-2 text-xs font-semibold text-navy-400">
              Décomposition du prix
            </p>
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-navy-700/30 py-1.5 last:border-0"
              >
                <span className="text-xs text-navy-400">{s.label}</span>
                <div className="flex items-center gap-2">
                  {s.impact !== null && (
                    <span
                      className={`text-xs font-medium ${s.impact >= 0 ? "text-red-400" : "text-lime-400"}`}
                    >
                      {s.impact >= 0 ? "+" : ""}
                      {Math.round(s.impact)} €
                    </span>
                  )}
                  <span className="w-16 text-right text-xs font-medium text-navy-100">
                    {Math.round(s.montant)} €
                  </span>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-navy-700/50 pt-2">
              <span className="text-xs font-semibold text-navy-400">
                TVA 10%
              </span>
              <span className="text-xs text-navy-100">
                +{Math.round(prixHT * TVA)} €
              </span>
            </div>
          </div>

          {/* Résultat */}
          <div className="mt-3 rounded-lg bg-lime-400/10 p-3 text-center">
            <p className="text-3xl font-bold text-lime-400">
              {Math.round(prixTTC)} €
              <span className="ml-1 text-sm font-normal text-navy-400">
                TTC
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleCreerNouveau}
              disabled={saving}
              className="rounded-lg bg-navy-800 px-4 py-2.5 text-xs font-semibold text-navy-100 transition-colors hover:bg-navy-700 disabled:opacity-50"
            >
              {saving ? "Création..." : `Créer un nouveau devis (N°${nextVersion})`}
            </button>
            {devisEnvoye ? (
              <div className="rounded-lg bg-blue-400/10 px-4 py-2.5 text-center text-xs font-medium text-blue-400">
                Devis N°{currentVersion} déjà envoyé
              </div>
            ) : (
              <button
                onClick={handleEnvoyer}
                disabled={sending}
                className="rounded-lg bg-lime-400 px-4 py-2.5 text-xs font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:opacity-50"
              >
                {sending ? "Envoi..." : `Envoyer le devis N°${currentVersion}`}
              </button>
            )}
            {!devisEnvoye && (
              <button
                onClick={handleSupprimer}
                className="rounded-lg bg-red-400/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/20"
              >
                Supprimer ce devis
              </button>
            )}
          </div>
        </div>

        {/* Right — PDF Preview */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-navy-700/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-navy-100">
              Aperçu PDF — {devisData.reference}
            </h2>
            <button
              onClick={onClose}
              className="hidden rounded-lg p-1 text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-100 lg:block"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              key={pdfVersion}
              src={`/api/devis/${currentDevisId}/pdf`}
              className="h-full w-full"
              title="Aperçu du devis"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
