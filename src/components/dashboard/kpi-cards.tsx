import { FileText, Users, Calendar, CheckSquare } from "lucide-react";
import { getDocuments } from "@/actions/documents";
import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayEvents } from "@/actions/events";
import { getUserTodos } from "@/actions/todos";

const kpis = [
  { key: "documents", label: "Documents", icon: FileText, color: "text-blue-600 bg-blue-50" },
  { key: "collaborateurs", label: "Collaborateurs", icon: Users, color: "text-emerald-600 bg-emerald-50" },
  { key: "reunions", label: "Réunions du jour", icon: Calendar, color: "text-purple-600 bg-purple-50" },
  { key: "taches", label: "Tâches en cours", icon: CheckSquare, color: "text-amber-600 bg-amber-50" },
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
            className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-4 shadow-xs"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] ${kpi.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[var(--heading)]">
                {values[kpi.key] ?? 0}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{kpi.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
