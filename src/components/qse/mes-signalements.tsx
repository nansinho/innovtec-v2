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

const statusConfig: Record<string, { label: string; variant: "error" | "warning" | "success" | "default"; icon: typeof AlertCircle }> = {
  signale: { label: "Signalé", variant: "error", icon: AlertCircle },
  en_cours: { label: "En cours", variant: "warning", icon: Clock },
  resolu: { label: "Résolu", variant: "success", icon: CheckCircle },
  cloture: { label: "Clôturé", variant: "default", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; variant: "error" | "warning" | "info" | "default" }> = {
  faible: { label: "Faible", variant: "default" },
  moyenne: { label: "Moyenne", variant: "info" },
  haute: { label: "Haute", variant: "warning" },
  critique: { label: "Critique", variant: "error" },
};

interface MesSignalementsProps {
  signalements: DangerReport[];
}

export default function MesSignalements({ signalements }: MesSignalementsProps) {
  const router = useRouter();

  if (signalements.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-900">
          Aucun signalement
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-gray-400">
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
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4 text-gray-400" />
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              {s.is_anonymous && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <EyeOff className="h-3 w-3" />
                  Anonyme
                </span>
              )}
            </div>

            <h3 className="mb-1 text-sm font-semibold text-gray-900 group-hover:text-gray-700">
              {s.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-xs text-gray-400">
              {s.description}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
              <Badge variant={pri.variant}>{pri.label}</Badge>
              {cat && (
                <Badge variant="default">{cat.name}</Badge>
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

            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
              Voir le détail
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
