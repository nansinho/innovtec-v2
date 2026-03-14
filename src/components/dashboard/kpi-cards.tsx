import { FileText, Users, Calendar, CheckSquare } from "lucide-react";
import { getDocuments } from "@/actions/documents";
import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayEvents } from "@/actions/events";
import { getUserTodos } from "@/actions/todos";

const kpis = [
  { key: "documents", label: "Documents", icon: FileText, color: "text-blue-600", bg: "bg-blue-500/10", accent: "bg-blue-500" },
  { key: "collaborateurs", label: "Collaborateurs", icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10", accent: "bg-emerald-500" },
  { key: "reunions", label: "Réunions du jour", icon: Calendar, color: "text-purple-600", bg: "bg-purple-500/10", accent: "bg-purple-500" },
  { key: "taches", label: "Tâches en cours", icon: CheckSquare, color: "text-amber-600", bg: "bg-amber-500/10", accent: "bg-amber-500" },
];

export default async function KpiCards() {
  const [docs, users, events, todos] = await Promise.all([
    getDocuments().catch(() => []),
    getTrombinoscopeUsers().catch(() => []),
    getTodayEvents().catch(() => []),
    getUserTodos().catch(() => []),
  ]);

  const values: Record<string, number> = {
    documents: docs.length,
    collaborateurs: users.length,
    reunions: events.length,
    taches: (todos as { status: string }[]).filter((t) => t.status !== "done").length,
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.key}
            className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.04] transition-shadow hover:shadow-md"
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-0.5 ${kpi.accent}`} />

            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[var(--heading)]">
                  {values[kpi.key] ?? 0}
                </div>
                <div className="text-xs font-medium text-[var(--text-muted)]">{kpi.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
