"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronRight } from "lucide-react";
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
            onClick={() => !active && setMode("chantier")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] border py-[7px] text-center text-[11px] transition-colors",
              mode === "chantier"
                ? "border-[var(--yellow)] bg-[var(--yellow-surface)] font-medium text-[var(--yellow)]"
                : "border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)]",
              active && "opacity-50 cursor-not-allowed"
            )}
          >
            Chantier
          </button>
          <button
            onClick={() => !active && setMode("bureau")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] border py-[7px] text-center text-[11px] transition-colors",
              mode === "bureau"
                ? "border-[var(--yellow)] bg-[var(--yellow-surface)] font-medium text-[var(--yellow)]"
                : "border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)]",
              active && "opacity-50 cursor-not-allowed"
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
              background: active
                ? `conic-gradient(var(--yellow) 0deg ${progress}deg, var(--border-1) ${progress}deg 360deg)`
                : "conic-gradient(var(--border-1) 0deg 360deg)",
            }}
          >
            <div className="flex h-[100px] w-[100px] flex-col items-center justify-center rounded-full bg-[var(--card)]">
              <div className="text-[7.5px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                Temps travaill\u00e9
              </div>
              <div className="font-mono text-xl text-[var(--heading)]">
                {loading ? "--:--" : elapsed}
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

        {/* Action button */}
        {active ? (
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mb-1.5 w-full rounded-[var(--radius-sm)] bg-[var(--yellow)] py-[9px] text-xs font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            {isPending ? "..." : "Arr\u00eater le pointage"}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={isPending || loading}
            className="mb-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--yellow)] bg-[var(--yellow-surface)] py-[9px] text-xs font-medium text-[var(--yellow)] transition-colors hover:bg-[var(--yellow)] hover:text-white disabled:opacity-50"
          >
            {isPending ? "..." : "D\u00e9marrer le pointage"}
          </button>
        )}
        {startedLabel && (
          <div className="text-center font-mono text-[9px] text-[var(--text-muted)]">
            {startedLabel}
          </div>
        )}
      </div>
    </Card>
  );
}
