"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  leadStatus?: string;
  onClose: () => void;
  onDevisCreated?: (devis: {
    id: string; version: number; reference: string;
    prixHT: number; prixTTC: number;
    detail: { coeffSaison: number; coeffDate: number; coeffCapacite: number; marge: number; ajustementCustom: number };
  }) => void;
  embedded?: boolean;
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

export default function DevisPreview({
  devisId,
  leadId,
  devisData,
  totalDevis,
  leadStatus,
  onClose,
  onDevisCreated,
  embedded = false,
}: DevisPreviewProps) {
  const router = useRouter();
  const distanceKm = devisData.distanceKm;
  const prixBase = getPrixBaseFromDistance(distanceKm);
  const origPrixHT = parseFloat(devisData.prixHT);
  const multiplicateur = origPrixHT > prixBase * 1.5 * 1.5 ? 2 : 1;

  const [marge, setMarge] = useState(parseFloat(devisData.marge ?? "0.15"));
  const [coeffSaison, setCoeffSaison] = useState(parseFloat(devisData.coeffSaison ?? "0"));
  const [coeffDate, setCoeffDate] = useState(parseFloat(devisData.coeffDate ?? "0"));
  const [coeffCapacite, setCoeffCapacite] = useState(parseFloat(devisData.coeffCapacite ?? "0"));
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

  const isAccepte = leadStatus === "Devis accepté";
  const fieldsLocked = devisEnvoye || isAccepte;

  const prixApresBase = prixBase * multiplicateur;
  const prixApresMarge = prixApresBase * (1 + marge);
  const prixApresSaison = prixApresMarge * (1 + coeffSaison);
  const prixApresDate = prixApresSaison * (1 + coeffDate);
  const prixApresCapacite = prixApresDate * (1 + coeffCapacite);

  const customAjustement = customMode === "pct" ? -(Math.abs(customValue) / 100) : 0;
  const customEurAjustement = customMode === "eur" ? -Math.abs(customValue) : 0;
  const prixHT = prixApresCapacite * (1 + customAjustement) + customEurAjustement;
  const prixTTC = prixHT * (1 + TVA);

  const steps = [
    { label: `Prix base (${distanceKm} km${multiplicateur === 2 ? " × A/R" : ""})`, montant: prixApresBase, impact: null as number | null },
    { label: `Marge (${Math.round(marge * 100)}%)`, montant: prixApresMarge, impact: prixApresMarge - prixApresBase },
    { label: `Saisonnalité (${coeffSaison >= 0 ? "+" : ""}${Math.round(coeffSaison * 100)}%)`, montant: prixApresSaison, impact: prixApresSaison - prixApresMarge },
    { label: `Délai (${coeffDate >= 0 ? "+" : ""}${Math.round(coeffDate * 100)}%)`, montant: prixApresDate, impact: prixApresDate - prixApresSaison },
    { label: `Capacité (${coeffCapacite >= 0 ? "+" : ""}${Math.round(coeffCapacite * 100)}%)`, montant: prixApresCapacite, impact: prixApresCapacite - prixApresDate },
  ];
  if (customValue !== 0 && customLabel) {
    steps.push({
      label: `${customLabel} (${customMode === "pct" ? `-${Math.abs(customValue)}%` : `-${Math.abs(customValue)}€`})`,
      montant: prixHT,
      impact: prixHT - prixApresCapacite,
    });
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleCreerNouveau() {
    setSaving(true);
    try {
      const ajustement = customMode === "pct" && customValue ? -(Math.abs(customValue) / 100) : undefined;
      const res = await fetch(`/api/leads/${leadId}/devis-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coeffSaison, coeffDate, coeffCapacite, marge, ajustementCustom: ajustement }),
      });
      if (!res.ok) { alert((await res.json()).error || "Erreur"); return; }
      const data = await res.json();
      setCurrentDevisId(data.devis.id);
      setCurrentVersion(data.devis.version);
      setNextVersion(data.devis.version + 1);
      setDevisEnvoye(false);
      setPdfVersion((v) => v + 1);
      if (onDevisCreated) {
        onDevisCreated(data.devis);
      } else {
        router.refresh();
        onClose();
      }
    } finally { setSaving(false); }
  }

  async function handleEnvoyer() {
    setSending(true);
    try {
      const res = await fetch(`/api/devis/${currentDevisId}/envoyer`, { method: "POST" });
      if (!res.ok) { alert((await res.json()).error || "Erreur"); return; }
      setDevisEnvoye(true);
      router.refresh();
    } finally { setSending(false); }
  }

  async function handleSupprimer() {
    if (!confirm("Supprimer ce devis ?")) return;
    const res = await fetch(`/api/devis/${currentDevisId}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Erreur"); return; }
    window.location.reload();
  }

  const isEmbedded = embedded;
  const txtLabel = isEmbedded ? "text-gray-500" : "text-navy-400";
  const txtValue = isEmbedded ? "text-gray-900" : "text-navy-100";
  const bgInput = isEmbedded
    ? "border-gray-200 bg-white text-gray-700 focus:border-blue-400"
    : "border-navy-700 bg-navy-800 text-navy-100 focus:border-lime-400";
  const selectCls = `w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${bgInput}`;
  const bgBreakdown = isEmbedded ? "bg-gray-50 border border-gray-100" : "bg-navy-800";
  const bgResult = isEmbedded ? "bg-green-50 border border-green-100" : "bg-lime-400/10";
  const txtResult = isEmbedded ? "text-green-600" : "text-lime-400";
  const btnSecondary = isEmbedded
    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
    : "bg-navy-800 text-navy-100 hover:bg-navy-700";
  const btnPrimary = isEmbedded
    ? "bg-navy-950 text-white hover:bg-navy-800"
    : "bg-lime-400 text-navy-950 hover:bg-lime-300";

  function formatDateTime(d: Date | string | null): string {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
    }) + " à " + date.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    });
  }

  const simulator = (
    <div className="p-5">
      <h2 className={`text-sm font-semibold ${txtValue}`}>
        Devis N°{currentVersion} — {devisData.reference}
      </h2>

      {/* Status badges */}
      <div className="mb-4 mt-2 flex flex-wrap gap-2">
        {devisEnvoye && devisData.envoyeLe && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isEmbedded ? "bg-blue-50 text-blue-600" : "bg-blue-400/15 text-blue-400"}`}>
            Envoyé le {formatDateTime(devisData.envoyeLe)}
          </span>
        )}
        {leadStatus === "Devis refusé" && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isEmbedded ? "bg-red-50 text-red-600" : "bg-red-400/15 text-red-400"}`}>
            Refusé
          </span>
        )}
        {leadStatus === "Devis accepté" && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isEmbedded ? "bg-green-50 text-green-600" : "bg-lime-400/15 text-lime-400"}`}>
            Accepté
          </span>
        )}
        {!devisEnvoye && !leadStatus?.startsWith("Devis") && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isEmbedded ? "bg-yellow-50 text-yellow-600" : "bg-yellow-400/15 text-yellow-400"}`}>
            Non envoyé
          </span>
        )}
      </div>

      <div className={`space-y-3 ${fieldsLocked ? "opacity-60" : ""}`}>
        <div>
          <label className={`mb-1 block text-xs ${txtLabel}`}>Saisonnalité</label>
          <select disabled={fieldsLocked} value={coeffSaison} onChange={(e) => setCoeffSaison(parseFloat(e.target.value))} className={selectCls}>
            {SAISON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={`mb-1 block text-xs ${txtLabel}`}>Délai demande / départ</label>
          <select disabled={fieldsLocked} value={coeffDate} onChange={(e) => setCoeffDate(parseFloat(e.target.value))} className={selectCls}>
            {DATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={`mb-1 block text-xs ${txtLabel}`}>Capacité</label>
          <select disabled={fieldsLocked} value={coeffCapacite} onChange={(e) => setCoeffCapacite(parseFloat(e.target.value))} className={selectCls}>
            {CAPACITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={`mb-1 block text-xs ${txtLabel}`}>Marge</label>
          <div className="flex items-center gap-2">
            <input disabled={fieldsLocked} type="number" min="0" value={Math.round(marge * 100)} onChange={(e) => setMarge(Math.max(0, parseFloat(e.target.value) || 0) / 100)} className={`w-20 rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${bgInput}`} />
            <span className={`text-xs ${txtLabel}`}>%</span>
          </div>
        </div>
        <div className={`border-t pt-3 ${isEmbedded ? "border-gray-200" : "border-navy-700/50"}`}>
          <label className={`mb-1 block text-xs ${txtLabel}`}>Remise personnalisée</label>
          <input disabled={fieldsLocked} value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Ex: Remise fidélité..." className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-xs placeholder:opacity-50 focus:outline-none ${bgInput}`} />
          <div className="flex items-center gap-2">
            <input disabled={fieldsLocked} type="number" min="0" value={customValue} onChange={(e) => setCustomValue(Math.max(0, parseFloat(e.target.value) || 0))} className={`w-20 rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${bgInput}`} />
            <select disabled={fieldsLocked} value={customMode} onChange={(e) => setCustomMode(e.target.value as "pct" | "eur")} className={`rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${bgInput}`}>
              <option value="pct">%</option>
              <option value="eur">€</option>
            </select>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className={`mt-4 rounded-lg p-3 ${bgBreakdown}`}>
        <p className={`mb-2 text-xs font-semibold ${txtLabel}`}>Décomposition du prix</p>
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${isEmbedded ? "border-gray-100" : "border-navy-700/30"}`}>
            <span className={`text-xs ${txtLabel}`}>{s.label}</span>
            <div className="flex items-center gap-2">
              {s.impact !== null && (
                <span className={`text-xs font-medium ${s.impact >= 0 ? "text-red-400" : "text-green-500"}`}>
                  {s.impact >= 0 ? "+" : ""}{Math.round(s.impact)} €
                </span>
              )}
              <span className={`w-16 text-right text-xs font-medium ${txtValue}`}>{Math.round(s.montant)} €</span>
            </div>
          </div>
        ))}
        <div className={`mt-2 flex items-center justify-between border-t pt-2 ${isEmbedded ? "border-gray-200" : "border-navy-700/50"}`}>
          <span className={`text-xs font-semibold ${txtLabel}`}>TVA 10%</span>
          <span className={`text-xs ${txtValue}`}>+{Math.round(prixHT * TVA)} €</span>
        </div>
      </div>

      {/* Result */}
      <div className={`mt-3 rounded-lg p-3 text-center ${bgResult}`}>
        <p className={`text-3xl font-bold ${txtResult}`}>
          {Math.round(prixTTC)} €
          <span className={`ml-1 text-sm font-normal ${txtLabel}`}>TTC</span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-col gap-2">
        {!isAccepte && (
          <button onClick={handleCreerNouveau} disabled={saving} className={`rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-50 ${btnSecondary}`}>
            {saving ? "Création..." : `Créer un nouveau devis (N°${nextVersion})`}
          </button>
        )}
        {isAccepte ? (
          <div className="rounded-lg bg-green-50 px-4 py-2.5 text-center text-xs font-medium text-green-600">
            Devis accepté par le client
          </div>
        ) : devisEnvoye ? (
          <div className="rounded-lg bg-blue-50 px-4 py-2.5 text-center text-xs font-medium text-blue-500">
            Devis N°{currentVersion} déjà envoyé
          </div>
        ) : (
          <button onClick={handleEnvoyer} disabled={sending} className={`rounded-lg px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${btnPrimary}`}>
            {sending ? "Envoi..." : `Envoyer le devis N°${currentVersion}`}
          </button>
        )}
        {!devisEnvoye && !isAccepte && (
          <button onClick={handleSupprimer} className="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100">
            Supprimer ce devis
          </button>
        )}
      </div>
    </div>
  );

  if (embedded) return simulator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl lg:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-full flex-col overflow-y-auto border-b border-gray-200 lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
          {simulator}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Aperçu PDF — {devisData.reference}</h2>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe key={pdfVersion} src={`/api/devis/${currentDevisId}/pdf`} className="h-full w-full" title="Aperçu du devis" />
          </div>
        </div>
      </div>
    </div>
  );
}
