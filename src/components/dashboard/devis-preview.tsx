"use client";

import { useEffect } from "react";

interface DevisPreviewProps {
  devisId: string;
  onClose: () => void;
}

export default function DevisPreview({ devisId, onClose }: DevisPreviewProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-navy-700/50 bg-navy-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy-700/50 px-6 py-3">
          <h2 className="text-sm font-semibold text-navy-100">
            Aperçu du devis
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

        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`/api/devis/${devisId}/pdf`}
            className="h-full w-full"
            title="Aperçu du devis"
          />
        </div>
      </div>
    </div>
  );
}
