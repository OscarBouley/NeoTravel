"use client";

export default function ChatPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/10">
        <svg
          className="h-8 w-8 text-lime-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-navy-100">
        Assistant IA
      </h3>
      <p className="max-w-xs text-sm text-navy-400">
        Bientôt disponible — décrivez votre besoin en langage naturel et notre
        assistant vous guidera pour constituer votre demande de devis.
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-navy-400" />
        <span className="text-xs text-navy-400">Prochainement</span>
      </div>
    </div>
  );
}
