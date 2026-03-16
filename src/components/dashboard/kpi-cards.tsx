import { FileText, Users, Calendar, CheckSquare } from "lucide-react";
import { getDocuments } from "@/actions/documents";
import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayEvents } from "@/actions/events";
import { getUserTodos } from "@/actions/todos";
import { StatValue, StatLabel } from "@/components/ui/card";

const kpis = [
  { key: "documents", label: "Documents", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  { key: "collaborateurs", label: "Collaborateurs", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
  { key: "reunions", label: "Réunions du jour", icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
  { key: "taches", label: "Tâches en cours", icon: CheckSquare, color: "text-amber-500", bg: "bg-amber-50" },
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
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.key}
            className={`animate-slide-up stagger-${i + 1} flex items-center gap-4 rounded-2xl bg-[var(--card)] p-5 transition-shadow duration-200 hover:shadow-md`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
              <Icon className={`h-[18px] w-[18px] ${kpi.color}`} strokeWidth={1.8} />
            </div>
            <div>
              <StatValue className="text-xl font-semibold leading-tight">{values[kpi.key] ?? 0}</StatValue>
              <StatLabel className="text-xs">{kpi.label}</StatLabel>
            </div>
          </div>
        );
      })}
    </div>
  );
}
