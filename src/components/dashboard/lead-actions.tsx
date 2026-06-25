"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: string, loadingKey: string) {
    setLoading(loadingKey);
    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const isRefused = currentStatus === "Devis refusé";

  return (
    <div className="flex items-center gap-3">
      {!isRefused && (
        <button
          onClick={() => updateStatus("Devis refusé", "refuse")}
          disabled={loading !== null}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          {loading === "refuse" ? "..." : "Marquer Refusé"}
        </button>
      )}
      <button
        onClick={() => updateStatus("Devis envoyé", "reprendre")}
        disabled={loading !== null}
        className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
      >
        {loading === "reprendre" ? "..." : "Reprendre la main"}
      </button>
    </div>
  );
}
