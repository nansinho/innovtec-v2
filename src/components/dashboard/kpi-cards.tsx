import { FileText, Users, Calendar, CheckSquare } from "lucide-react";
import { getDocuments } from "@/actions/documents";
import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayEvents } from "@/actions/events";
import { getUserTodos } from "@/actions/todos";

const kpis = [
  { key: "documents", label: "Documents", icon: FileText },
  { key: "collaborateurs", label: "Collaborateurs", icon: Users },
  { key: "reunions", label: "Réunions du jour", icon: Calendar },
  { key: "taches", label: "Tâches en cours", icon: CheckSquare },
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
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.key}
            className={`animate-slide-up stagger-${i + 1} rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {kpi.label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">
                  {values[kpi.key] ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
