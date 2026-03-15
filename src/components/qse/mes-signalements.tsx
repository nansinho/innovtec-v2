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
import { Badge } from "@/components/ui/badge";
import type { DangerReport } from "@/lib/types/database";

const statusConfig: Record<string, { label: string; variant: "red" | "yellow" | "green" | "default"; icon: typeof AlertCircle }> = {
  signale: { label: "Signalé", variant: "red", icon: AlertCircle },
  en_cours: { label: "En cours", variant: "yellow", icon: Clock },
  resolu: { label: "Résolu", variant: "green", icon: CheckCircle },
  cloture: { label: "Clôturé", variant: "default", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; variant: "green" | "yellow" | "red" | "default" }> = {
  faible: { label: "Faible", variant: "green" },
  moyenne: { label: "Moyenne", variant: "yellow" },
  haute: { label: "Haute", variant: "red" },
  critique: { label: "Critique", variant: "red" },
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
        const st = statusConfig[s.status] ?? statusConfig.signale;
        const pri = priorityConfig[s.priority] ?? priorityConfig.faible;
        const cat = s.category as { name: string; color: string } | null;
        const StatusIcon = st.icon;

        return (
          <button
            key={s.id}
            onClick={() => router.push(`/qse/signalements/${s.id}`)}
            className="group flex flex-col rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-4 text-left shadow-xs transition-all hover:border-[var(--yellow)] hover:shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" style={{ color: `var(--${st.variant === "default" ? "text-muted" : st.variant})` }} />
                <Badge variant={st.variant}>{st.label}</Badge>
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
              <Badge variant={pri.variant}>{pri.label}</Badge>
              {cat && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
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
