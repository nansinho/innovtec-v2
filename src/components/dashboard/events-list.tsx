import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EventItem {
  name: string;
  date: string;
  color: "yellow" | "blue" | "purple" | "green";
}

const events: EventItem[] = [
  { name: "Réunion chantier Voltaire", date: "22 Fév 2026 · 9:15", color: "yellow" },
  { name: "Formation sécurité — EPI", date: "24 Fév 2026 · 14:00", color: "blue" },
  { name: "Audit QSE trimestriel", date: "28 Fév 2026 · 10:00", color: "purple" },
];

const colorMap = {
  yellow: {
    bg: "bg-[rgba(245,166,35,0.04)]",
    bar: "bg-[var(--yellow)]",
  },
  blue: {
    bg: "bg-[rgba(37,99,235,0.04)]",
    bar: "bg-[var(--blue)]",
  },
  purple: {
    bg: "bg-[rgba(124,58,237,0.04)]",
    bar: "bg-[var(--purple)]",
  },
  green: {
    bg: "bg-[rgba(22,163,74,0.04)]",
    bar: "bg-[var(--green)]",
  },
};

export default function EventsList() {
  return (
    <Card>
      <CardHeader
        title="Événements à venir"
        action={
          <Link
            href="/equipe/planning"
            className="flex items-center text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="space-y-2 px-4 py-2">
        {events.map((event) => (
          <div
            key={event.name}
            className={cn(
              "flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)]",
              colorMap[event.color].bg
            )}
          >
            <div className={cn("w-1 shrink-0", colorMap[event.color].bar)} />
            <div className="flex flex-1 items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-[12.5px] font-medium text-[var(--heading)]">
                  {event.name}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)]">
                  {event.date}
                </div>
              </div>
              <button className="px-2 py-2.5 text-sm text-[var(--text-muted)]">
                ···
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
