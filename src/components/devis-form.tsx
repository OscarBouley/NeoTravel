"use client";

import { useState } from "react";

type Besoin = "aller_simple" | "aller_retour" | "circuit";

const BESOIN_OPTIONS: { value: Besoin; label: string }[] = [
  { value: "aller_retour", label: "Aller-Retour" },
  { value: "aller_simple", label: "Aller simple" },
  { value: "circuit", label: "Circuit" },
];

const inputClass =
  "w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-navy-100 placeholder:text-navy-400/60 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-colors";

const labelClass = "text-xs font-medium text-navy-400";

export default function DevisForm() {
  const [besoin, setBesoin] = useState<Besoin | "">("");
  const [voyageursMode, setVoyageursMode] = useState<"exact" | "range">(
    "exact",
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const voyageursMin = Number(form.get("voyageursMin")) || null;
    const voyageursMax =
      voyageursMode === "exact"
        ? voyageursMin
        : Number(form.get("voyageursMax")) || null;

    const payload = {
      nom: form.get("nom"),
      prenom: form.get("prenom"),
      email: form.get("email"),
      telephone: form.get("telephone"),
      societe: form.get("societe"),
      departVille: form.get("departVille"),
      departDate: form.get("departDate") || null,
      departHeure: form.get("departHeure") || null,
      arriveeVille: form.get("arriveeVille"),
      arriveeDate: form.get("arriveeDate") || null,
      arriveeHeure: form.get("arriveeHeure") || null,
      besoin,
      voyageursMin,
      voyageursMax,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-400/15">
          <svg className="h-7 w-7 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-navy-100">Demande envoyée !</h3>
        <p className="max-w-sm text-sm text-navy-400">
          Nous avons bien reçu votre demande. Notre équipe vous
          recontactera dans les plus brefs délais.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-3 rounded-lg bg-navy-800 px-5 py-2 text-sm font-medium text-navy-100 transition-colors hover:bg-navy-700"
        >
          Nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Type de déplacement */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-navy-400">
          Type de déplacement
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BESOIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBesoin(opt.value)}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                besoin === opt.value
                  ? "border-lime-400 bg-lime-400/10 text-lime-400"
                  : "border-navy-700 bg-navy-800 text-navy-100 hover:border-navy-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Départ */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-navy-400">Départ</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="departVille" className={labelClass}>Ville *</label>
            <input id="departVille" name="departVille" type="text" required placeholder="Ex: Paris, Lyon..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="departDate" className={labelClass}>Date</label>
            <input id="departDate" name="departDate" type="date" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="departHeure" className={labelClass}>Heure</label>
            <input id="departHeure" name="departHeure" type="time" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Arrivée */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-navy-400">Arrivée</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="arriveeVille" className={labelClass}>Ville *</label>
            <input id="arriveeVille" name="arriveeVille" type="text" required placeholder="Ex: Marseille, Bordeaux..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="arriveeDate" className={labelClass}>Date</label>
            <input id="arriveeDate" name="arriveeDate" type="date" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="arriveeHeure" className={labelClass}>Heure</label>
            <input id="arriveeHeure" name="arriveeHeure" type="time" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Voyageurs */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-navy-400">
            Voyageurs
          </span>
          <div className="flex gap-1">
            {(["exact", "range"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setVoyageursMode(mode)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  voyageursMode === mode
                    ? "bg-lime-400/15 text-lime-400"
                    : "bg-navy-800 text-navy-400 hover:text-navy-100"
                }`}
              >
                {mode === "exact" ? "Exact" : "Fourchette"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <input
            name="voyageursMin"
            type="number"
            min={1}
            placeholder={voyageursMode === "exact" ? "Nombre de voyageurs" : "Min"}
            className={inputClass}
          />
          {voyageursMode === "range" && (
            <input name="voyageursMax" type="number" min={1} placeholder="Max" className={inputClass} />
          )}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="nom" className={labelClass}>Nom *</label>
          <input id="nom" name="nom" type="text" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="prenom" className={labelClass}>Prénom</label>
          <input id="prenom" name="prenom" type="text" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input id="email" name="email" type="email" required placeholder="votre@email.com" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="telephone" className={labelClass}>Téléphone</label>
          <input id="telephone" name="telephone" type="tel" placeholder="06 00 00 00 00" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="societe" className={labelClass}>Société / Organisation</label>
          <input id="societe" name="societe" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !besoin}
        className="rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Envoi en cours..." : "Obtenir mon devis →"}
      </button>
    </form>
  );
}
