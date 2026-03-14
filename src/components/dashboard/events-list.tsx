import { ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUpcomingEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventColor } from "@/lib/types/database";

const colorMap: Record<string, { bg: string; bar: string }> = {
  yellow: { bg: "bg-amber-50/60", bar: "bg-amber-400" },
  blue: { bg: "bg-blue-50/60", bar: "bg-blue-400" },
  purple: { bg: "bg-purple-50/60", bar: "bg-purple-400" },
  green: { bg: "bg-emerald-50/60", bar: "bg-emerald-400" },
  red: { bg: "bg-red-50/60", bar: "bg-red-400" },
};

export default async function EventsList() {
  const events = await getUpcomingEvents();

  return (
    <Card>
      <CardHeader
        title="Événements à venir"
        action={
          <Link
            href="/equipe/planning"
            className="flex items-center text-[var(--yellow)] transition-opacity hover:opacity-80"
            aria-label="Voir tous les événements"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-2 px-4 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CalendarDays className="mb-2 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-[var(--text-muted)]">
              Aucun événement à venir
            </p>
          </div>
        ) : (
          events.slice(0, 5).map((event) => {
            const colors = colorMap[event.color] ?? colorMap.blue;
            const dateStr = format(new Date(event.start_at), "d MMM yyyy · HH:mm", {
              locale: fr,
            });

            return (
              <div
                key={event.id}
                className={cn(
                  "flex overflow-hidden rounded-[var(--radius)]",
                  colors.bg
                )}
              >
                <div className={cn("w-1 shrink-0 rounded-l-[var(--radius)]", colors.bar)} />
                <div className="flex flex-1 items-center justify-between px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-[var(--heading)]">
                      {event.title}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {dateStr}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
