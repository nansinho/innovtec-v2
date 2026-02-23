"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { updateDangerStatus } from "@/actions/qse";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  signale: { label: "Signalé", color: "text-[var(--red)]", bg: "bg-[var(--red-surface)]" },
  en_cours: { label: "En cours", color: "text-orange-700", bg: "bg-orange-50" },
  resolu: { label: "Résolu", color: "text-[var(--green)]", bg: "bg-[var(--green-surface)]" },
  cloture: { label: "Clôturé", color: "text-[var(--text-secondary)]", bg: "bg-[var(--hover)]" },
};

const severityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Faible", color: "text-[var(--green)]" },
  2: { label: "Modérée", color: "text-[var(--yellow)]" },
  3: { label: "Sérieuse", color: "text-orange-600" },
  4: { label: "Grave", color: "text-[var(--red)]" },
  5: { label: "Critique", color: "text-red-800" },
};

interface DangerItem {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  severity: number;
  created_at: string;
  reporter?: { first_name: string; last_name: string } | null;
}

interface DangerListProps {
  dangers: DangerItem[];
  canManage: boolean;
}

export default function DangerList({ dangers: initialDangers, canManage }: DangerListProps) {
  const [dangers, setDangers] = useState(initialDangers);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const filtered =
    filterStatus === "all"
      ? dangers
      : dangers.filter((d) => d.status === filterStatus);

  const statusCounts = dangers.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateDangerStatus(id, newStatus);
      if (result.success) {
        setDangers((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    });
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["signale", "en_cours", "resolu", "cloture"] as const).map((status) => {
          const config = statusConfig[status];
          return (
            <div
              key={status}
              className={cn(
                "rounded-[var(--radius-sm)] border border-[var(--border-1)] p-4 text-center shadow-xs",
                config.bg
              )}
            >
              <p className={cn("text-xl font-bold", config.color)}>
                {statusCounts[status] || 0}
              </p>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                {config.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--text-muted)]" />
        <button
          onClick={() => setFilterStatus("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
            filterStatus === "all"
              ? "bg-[var(--navy)] text-white shadow-xs"
              : "bg-[var(--hover)] text-[var(--text-secondary)] hover:bg-[var(--border-1)]"
          )}
        >
          Tous ({dangers.length})
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
              filterStatus === key
                ? "bg-[var(--navy)] text-white shadow-xs"
                : "bg-[var(--hover)] text-[var(--text-secondary)] hover:bg-[var(--border-1)]"
            )}
          >
            {config.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune situation dangereuse signalée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((danger) => {
            const status = statusConfig[danger.status] ?? statusConfig.signale;
            const severity = severityLabels[danger.severity] ?? severityLabels[1];
            const reporter = danger.reporter as unknown as { first_name: string; last_name: string } | null;

            return (
              <div
                key={danger.id}
                className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                          status.bg,
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                      <span className={cn("text-[10px] font-medium", severity.color)}>
                        Sévérité : {severity.label} ({danger.severity}/5)
                      </span>
                    </div>
                    <h3 className="text-[13px] font-semibold text-[var(--heading)]">
                      {danger.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                      {danger.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                      {danger.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {danger.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelative(danger.created_at)}
                      </span>
                      {reporter && (
                        <span>
                          Par {reporter.first_name} {reporter.last_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status change */}
                  {canManage && danger.status !== "cloture" && (
                    <div className="relative shrink-0">
                      <select
                        value={danger.status}
                        onChange={(e) =>
                          handleStatusChange(danger.id, e.target.value)
                        }
                        disabled={isPending}
                        className="appearance-none rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-[var(--card)] py-1.5 pl-2.5 pr-6 text-[11px] outline-none transition-colors focus:border-[var(--yellow)]"
                      >
                        <option value="signale">Signalé</option>
                        <option value="en_cours">En cours</option>
                        <option value="resolu">Résolu</option>
                        <option value="cloture">Clôturé</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
