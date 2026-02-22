"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyCredits } from "@/actions/ai-credits";

interface AiGenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function AiGenerateButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Générer avec l'IA",
  className,
}: AiGenerateButtonProps) {
  const [credits, setCredits] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    getMyCredits().then(setCredits);
  }, [loading]);

  const noCredits = credits !== null && credits.remaining <= 0;

  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <button
        onClick={onClick}
        disabled={disabled || loading || noCredits}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "Génération en cours..." : label}
      </button>
      {credits !== null && (
        <span
          className={cn(
            "text-[10px] font-medium",
            noCredits ? "text-red-500" : "text-[var(--text-muted)]"
          )}
        >
          {noCredits
            ? "Crédits IA épuisés ce mois-ci"
            : credits.limit >= 999999
              ? "Crédits IA illimités"
              : `${credits.remaining} crédit${credits.remaining > 1 ? "s" : ""} IA restant${credits.remaining > 1 ? "s" : ""}`}
        </span>
      )}
    </div>
  );
}
