import { FileText, Users, Calendar, CheckSquare } from "lucide-react";
import { getDocuments } from "@/actions/documents";
import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayEvents } from "@/actions/events";
import { getUserTodos } from "@/actions/todos";
import { StatValue, StatLabel } from "@/components/ui/card";

const kpis = [
  { key: "documents", label: "Documents", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/[0.06]", accent: "bg-blue-500" },
  { key: "collaborateurs", label: "Collaborateurs", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/[0.06]", accent: "bg-emerald-500" },
  { key: "reunions", label: "Réunions du jour", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/[0.06]", accent: "bg-purple-500" },
  { key: "taches", label: "Tâches en cours", icon: CheckSquare, color: "text-amber-500", bg: "bg-amber-500/[0.06]", accent: "bg-amber-500" },
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
            className={`animate-slide-up stagger-${i + 1} relative overflow-hidden rounded-xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:scale-[1.01]`}
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-[2px] ${kpi.accent} opacity-60`} />

            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <StatValue>{values[kpi.key] ?? 0}</StatValue>
                <StatLabel>{kpi.label}</StatLabel>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
