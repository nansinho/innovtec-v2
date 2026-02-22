"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Timebit() {
  const [mode, setMode] = useState<"chantier" | "bureau">("bureau");

  return (
    <Card>
      <div className="px-5 py-[18px]">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--heading)]">
            Timebit
          </span>
          <Link
            href="#"
            className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            Voir logs <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mode toggle */}
        <div className="mb-3.5 flex gap-1.5">
          <button
            onClick={() => setMode("chantier")}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] border py-[7px] text-center text-[11px] transition-colors",
              mode === "chantier"
                ? "border-[var(--yellow)] bg-[var(--yellow-surface)] font-medium text-[#b07800]"
                : "border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)]"
            )}
          >
            Chantier
          </button>
          <button
            onClick={() => setMode("bureau")}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] border py-[7px] text-center text-[11px] transition-colors",
              mode === "bureau"
                ? "border-[var(--yellow)] bg-[var(--yellow-surface)] font-medium text-[#b07800]"
                : "border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)]"
            )}
          >
            Bureau
          </button>
        </div>

        {/* Clock ring */}
        <div className="mb-3.5 flex flex-col items-center">
          <div
            className="mb-2 flex h-[120px] w-[120px] items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(var(--yellow) 0deg 280deg, var(--border-1) 280deg 360deg)",
            }}
          >
            <div className="flex h-[100px] w-[100px] flex-col items-center justify-center rounded-full bg-[var(--card)]">
              <div className="text-[7.5px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                Temps travaillé
              </div>
              <div className="font-mono text-xl text-[var(--heading)]">
                7:51:32
              </div>
            </div>
          </div>
          <div className="flex gap-3 text-[9px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-[var(--yellow)]" />
              temps normal
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-[var(--border-1)]" />
              heures sup.
            </div>
          </div>
        </div>

        {/* Stop button */}
        <button className="mb-1.5 w-full rounded-[var(--radius-sm)] bg-[var(--yellow)] py-[9px] text-xs font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]">
          Arrêter le pointage
        </button>
        <div className="text-center font-mono text-[9px] text-[var(--text-muted)]">
          Dim. 22 Fév 2026, 07:56
        </div>
      </div>
    </Card>
  );
}
