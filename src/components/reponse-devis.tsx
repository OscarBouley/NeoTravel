"use client";

import { useEffect, useState } from "react";

interface Props {
  devisId: string;
  action: "accepter" | "decliner";
}

type Status = "loading" | "success" | "already_responded" | "error";

export default function ReponseDevis({ devisId, action }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [existingChoice, setExistingChoice] = useState<string>("");

  useEffect(() => {
    fetch(`/api/devis/${devisId}/repondre`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 409) {
          setExistingChoice(data.status);
          setStatus("already_responded");
        } else if (!res.ok) {
          setStatus("error");
        } else {
          setStatus("success");
        }
      })
      .catch(() => setStatus("error"));
  }, [devisId, action]);

  const isAccept = action === "accepter";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-8 text-center">
        <span className="text-xl font-bold tracking-tight text-navy-100">
          Neo<span className="text-lime-400">Travel</span>
        </span>

        {status === "loading" && (
          <div className="mt-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-navy-400 border-t-lime-400" />
            <p className="mt-4 text-sm text-navy-400">
              Enregistrement de votre réponse...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isAccept ? "bg-lime-400/15" : "bg-navy-700/50"}`}
            >
              {isAccept ? (
                <svg className="h-8 w-8 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-navy-100">
              {isAccept ? "Devis accepté !" : "Devis décliné"}
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              {isAccept
                ? "Merci pour votre confiance ! Un conseiller NeoTravel vous recontactera très prochainement pour organiser les détails de votre transport."
                : "Nous avons bien pris note de votre décision. Si vous changez d'avis ou souhaitez un nouveau devis, n'hésitez pas à nous recontacter."}
            </p>
          </div>
        )}

        {status === "already_responded" && (
          <div className="mt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-700/50">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-navy-100">
              Réponse déjà enregistrée
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              Vous avez déjà répondu à ce devis ({existingChoice.toLowerCase()}). Cette décision est définitive.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <p className="text-sm text-red-400">
              Une erreur est survenue. Ce lien est peut-être invalide
              ou le devis n'existe plus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
