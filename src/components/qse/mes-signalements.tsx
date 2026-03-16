"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { SIGNALEMENT_STATUS_MAP, PRIORITY_MAP } from "@/lib/status-config";
import type { DangerReport } from "@/lib/types/database";

const statusIcons: Record<string, typeof AlertCircle> = {
  signale: AlertCircle,
  en_cours: Clock,
  resolu: CheckCircle,
  cloture: CheckCircle,
};

const statusColors: Record<string, string> = {
  signale: "var(--red)",
  en_cours: "var(--yellow)",
  resolu: "var(--green)",
  cloture: "var(--text-muted)",
};

interface MesSignalementsProps {
  signalements: DangerReport[];
}

export default function MesSignalements({ signalements }: MesSignalementsProps) {
  const router = useRouter();

  if (signalements.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--yellow-surface)]">
          <AlertTriangle className="h-7 w-7 text-[var(--yellow)]" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--heading)]">
          Aucun signalement
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--text-muted)]">
          Vous n&apos;avez pas encore soumis de signalement de situation dangereuse.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {signalements.map((s) => {
        const cat = s.category as { name: string; color: string } | null;
        const StatusIcon = statusIcons[s.status] ?? AlertCircle;

        return (
          <button
            key={s.id}
            onClick={() => router.push(`/qse/signalements/${s.id}`)}
            className="group flex flex-col rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-4 text-left shadow-xs transition-all hover:border-[var(--yellow)] hover:shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" style={{ color: statusColors[s.status] ?? "var(--text-muted)" }} />
                <StatusBadge module="signalements" status={s.status} />
              </div>
              {s.is_anonymous && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <EyeOff className="h-3 w-3" />
                  Anonyme
                </span>
              )}
            </div>

            <h3 className="mb-1 text-sm font-semibold text-[var(--heading)] group-hover:text-[var(--yellow)]">
              {s.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-xs text-[var(--text-muted)]">
              {s.description}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <PriorityBadge priority={s.priority} />
              {cat && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border-[1.5px] bg-transparent px-2 py-[1px] text-[11px] font-medium tracking-wide"
                  style={{ borderColor: cat.color, color: cat.color }}
                >
                  {cat.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {(s.incident_date ? new Date(s.incident_date) : new Date(s.created_at)).toLocaleDateString("fr-FR")}
              </span>
              {(s.chantier || s.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {s.chantier || s.location}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[var(--yellow)] opacity-0 transition-opacity group-hover:opacity-100">
              Voir le détail
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
