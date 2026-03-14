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
      <div className="px-5 py-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--heading)]">
            Timebit
          </h3>
          <Link
            href="#"
            className="flex items-center gap-1 text-xs font-medium text-[var(--yellow)] transition-opacity hover:opacity-80"
          >
            Voir logs <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-1.5">
          <button
            onClick={() => !active && setMode("chantier")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-[var(--radius)] border py-2 text-center text-xs font-medium transition-colors",
              mode === "chantier"
                ? "border-[var(--yellow)] bg-amber-50 text-amber-700"
                : "border-[var(--border-1)] bg-white text-[var(--text-secondary)]",
              active && "cursor-not-allowed opacity-50"
            )}
          >
            Chantier
          </button>
          <button
            onClick={() => !active && setMode("bureau")}
            disabled={!!active}
            className={cn(
              "flex-1 rounded-[var(--radius)] border py-2 text-center text-xs font-medium transition-colors",
              mode === "bureau"
                ? "border-[var(--yellow)] bg-amber-50 text-amber-700"
                : "border-[var(--border-1)] bg-white text-[var(--text-secondary)]",
              active && "cursor-not-allowed opacity-50"
            )}
          >
            Bureau
          </button>
        </div>

        {/* Clock ring */}
        <div className="mb-4 flex flex-col items-center">
          <div
            className="mb-2 flex h-[110px] w-[110px] items-center justify-center rounded-full"
            style={{
              background: active
                ? `conic-gradient(#F59E0B 0deg ${progress}deg, #e4e4e7 ${progress}deg 360deg)`
                : "conic-gradient(#e4e4e7 0deg 360deg)",
            }}
          >
            <div className="flex h-[90px] w-[90px] flex-col items-center justify-center rounded-full bg-white">
              <div className="text-[8px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                Temps travaill\u00e9
              </div>
              <div className="font-mono text-xl font-medium text-[var(--heading)]">
                {loading ? "--:--" : elapsed}
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              temps normal
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              heures sup.
            </div>
          </div>
        </div>

        {/* Action button */}
        {active ? (
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mb-2 w-full rounded-[var(--radius)] bg-[var(--yellow)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            {isPending ? "..." : "Arr\u00eater le pointage"}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={isPending || loading}
            className="mb-2 w-full rounded-[var(--radius)] border border-[var(--yellow)] bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-[var(--yellow)] hover:text-white disabled:opacity-50"
          >
            {isPending ? "..." : "D\u00e9marrer le pointage"}
          </button>
        )}
        {startedLabel && (
          <div className="text-center font-mono text-[10px] text-[var(--text-muted)]">
            {startedLabel}
          </div>
        )}
      </div>
    </Card>
  );
}
