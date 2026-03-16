"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  UserMinus,
  UserCheck,
  Pencil,
  Trash2,
  Shield,
  ArrowUpCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getActivityLogs, type ActivityLog } from "@/actions/users";

const PAGE_SIZE = 25;

const actionConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  create_user: {
    label: "Création d'utilisateur",
    icon: UserPlus,
    color: "bg-green-50 text-green-600",
  },
  update_user: {
    label: "Modification d'utilisateur",
    icon: Pencil,
    color: "bg-blue-50 text-blue-600",
  },
  change_role: {
    label: "Changement de rôle",
    icon: Shield,
    color: "bg-purple-50 text-purple-600",
  },
  deactivate_user: {
    label: "Désactivation",
    icon: UserMinus,
    color: "bg-orange-50 text-orange-600",
  },
  reactivate_user: {
    label: "Réactivation",
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-600",
  },
  delete_user: {
    label: "Suppression",
    icon: Trash2,
    color: "bg-red-50 text-red-600",
  },
  promote_to_admin: {
    label: "Promotion admin",
    icon: ArrowUpCircle,
    color: "bg-amber-50 text-amber-600",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHour < 24) return `Il y a ${diffHour}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionDescription(log: ActivityLog): string {
  const details = log.details || {};
  const userName = (details.user_name as string) || (details.name as string) || "";
  const email = (details.email as string) || "";

  switch (log.action) {
    case "create_user":
      return `a créé le compte de ${userName || email}`;
    case "update_user":
      return `a modifié les informations de ${userName}`;
    case "change_role": {
      const roleLabels: Record<string, string> = {
        admin: "Administrateur",
        rh: "RH",
        responsable_qse: "Responsable QSE",
        chef_chantier: "Chef de chantier",
        technicien: "Technicien",
        collaborateur: "Collaborateur",
      };
      return `a changé le rôle de ${userName} : ${roleLabels[(details.from as string) || ""] || details.from} → ${roleLabels[(details.to as string) || ""] || details.to}`;
    }
    case "deactivate_user":
      return `a désactivé le compte de ${userName || email}`;
    case "reactivate_user":
      return `a réactivé le compte de ${userName || email}`;
    case "delete_user":
      return `a supprimé le compte de ${(details.deleted_user as string) || email}`;
    case "promote_to_admin":
      return "a été promu administrateur (bootstrap)";
    default:
      return log.action;
  }
}

export default function ActivityLogsTable() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const result = await getActivityLogs(PAGE_SIZE, page * PAGE_SIZE);
    setLogs(result.logs);
    setTotal(result.total);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          {total} action{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
        </p>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:bg-black/[0.04] hover:text-[var(--heading)] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Logs list */}
      <div className="rounded-2xl border border-[var(--border-1)] bg-white shadow-sm ring-1 ring-black/[0.03]">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-1)] border-t-[var(--yellow)]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Activity className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">Aucune activité enregistrée</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-1)]">
            {logs.map((log) => {
              const config = actionConfig[log.action] || {
                label: log.action,
                icon: Activity,
                color: "bg-gray-50 text-gray-600",
              };
              const Icon = config.icon;
              const actor = log.user
                ? `${log.user.first_name} ${log.user.last_name}`.trim() || log.user.email
                : "Système";

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-[var(--hover)]"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium text-[var(--heading)]">
                        {actor}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {getActionDescription(log)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-1)] px-5 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              Page {page + 1} sur {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--heading)] disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--heading)] disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
