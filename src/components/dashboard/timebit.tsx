"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronRight, Timer } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getActiveTimebit, startTimebit, stopTimebit } from "@/actions/timebits";
import type { Timebit, TimebitMode } from "@/lib/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Timebit() {
  const [mode, setMode] = useState<TimebitMode>("bureau");
  const [active, setActive] = useState<Timebit | null>(null);
  const [elapsed, setElapsed] = useState("0:00:00");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getActiveTimebit().then((data) => {
      if (data) {
        setActive(data as Timebit);
        setMode(data.mode as TimebitMode);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!active) {
      setElapsed("0:00:00");
      setProgress(0);
      return;
    }

    function tick() {
      const start = new Date(active!.started_at).getTime();
      const now = Date.now();
      const diffMs = now - start;
      const totalSeconds = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setElapsed(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      const eightHours = 8 * 3600;
      setProgress(Math.min((totalSeconds / eightHours) * 360, 360));
    }

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active]);

  function handleStart() {
    startTransition(async () => {
      await startTimebit(mode);
      const data = await getActiveTimebit();
      if (data) setActive(data as Timebit);
    });
  }

  function handleStop() {
    if (!active) return;
    startTransition(async () => {
      await stopTimebit(active.id);
      setActive(null);
    });
  }

  const startedLabel = active
    ? format(new Date(active.started_at), "EEE. d MMM yyyy, HH:mm", { locale: fr })
    : "";

  return (
    <Card>
      <div className="px-5 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Timebit</h3>
          </div>
          <Link
            href="#"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-zinc-100 hover:text-[var(--heading)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => !active && setMode("chantier")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-all duration-200",
              mode === "chantier"
                ? "bg-white text-[var(--heading)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              active && "cursor-not-allowed opacity-50"
            )}
          >
            Chantier
          </button>
          <button
            onClick={() => !active && setMode("bureau")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-all duration-200",
              mode === "bureau"
                ? "bg-white text-[var(--heading)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              active && "cursor-not-allowed opacity-50"
            )}
          >
            Bureau
          </button>
        </div>

        {/* Clock ring */}
        <div className="mb-5 flex flex-col items-center">
          <div
            className="mb-3 flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-inner"
            style={{
              background: active
                ? `conic-gradient(#f59e0b 0deg, #d97706 ${progress}deg, #f4f4f5 ${progress}deg 360deg)`
                : "conic-gradient(#f4f4f5 0deg 360deg)",
            }}
          >
            <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full bg-white shadow-sm">
              <div className="text-[9px] font-semibold uppercase tracking-[1.5px] text-zinc-400">
                Temps travaillé
              </div>
              <div className="font-mono text-xl font-bold tracking-tight text-[var(--heading)]">
                {loading ? "--:--" : elapsed}
              </div>
            </div>
          </div>
          <div className="flex gap-5 text-[10px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-medium">Temps normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-zinc-200" />
              <span className="font-medium">Heures sup.</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        {active ? (
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mb-2 w-full rounded-lg bg-[var(--yellow)] py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "..." : "Arrêter le pointage"}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={isPending || loading}
            className="mb-2 w-full rounded-lg border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-[var(--heading)] shadow-xs transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "..." : "Démarrer le pointage"}
          </button>
        )}
        {startedLabel && (
          <div className="text-center font-mono text-[10px] text-zinc-400">
            {startedLabel}
          </div>
        )}
      </div>
    </Card>
  );
}
