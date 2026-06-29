"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

type Status = "form" | "submitting" | "success" | "error";

export default function ContactPage() {
  const { id } = useParams<{ id: string }>();
  const [telephone, setTelephone] = useState("");
  const [status, setStatus] = useState<Status>("form");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(`/api/devis/${id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-8 text-center">
        <span className="text-xl font-bold tracking-tight text-navy-100">
          Neo<span className="text-lime-400">Travel</span>
        </span>

        {status === "success" ? (
          <div className="mt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/15">
              <svg className="h-8 w-8 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-navy-100">
              Demande enregistrée !
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              Un conseiller NeoTravel vous recontactera très prochainement
              pour répondre à toutes vos questions.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-400/15">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-navy-100">
              Besoin d&apos;informations ?
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              Laissez-nous votre numéro de téléphone, un conseiller vous
              rappellera dans les plus brefs délais.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 00 00 00 00"
                required
                minLength={6}
                className="w-full rounded-xl border border-navy-700 bg-navy-800 px-4 py-3 text-center text-lg text-navy-100 placeholder:text-navy-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
              />
              <button
                type="submit"
                disabled={status === "submitting" || telephone.trim().length < 6}
                className="mt-4 w-full rounded-xl bg-lime-400 px-6 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "submitting" ? "Envoi en cours..." : "Être rappelé"}
              </button>
            </form>

            {status === "error" && (
              <p className="mt-4 text-sm text-red-400">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
