import { ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUpcomingEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventColor } from "@/lib/types/database";

const colorMap: Record<string, { bg: string; bar: string; dot: string }> = {
  yellow: { bg: "bg-amber-500/8", bar: "bg-amber-500", dot: "bg-amber-500" },
  blue: { bg: "bg-blue-500/8", bar: "bg-blue-500", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-500/8", bar: "bg-purple-500", dot: "bg-purple-500" },
  green: { bg: "bg-emerald-500/8", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  red: { bg: "bg-red-500/8", bar: "bg-red-500", dot: "bg-red-500" },
};

export default async function EventsList() {
  const events = await getUpcomingEvents();

  return (
    <Card>
      <CardHeader
        title="Événements à venir"
        icon={CalendarDays}
        action={
          <Link
            href="/equipe/planning"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-zinc-100 hover:text-[var(--heading)]"
            aria-label="Voir tous les événements"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-1.5 px-3 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <CalendarDays className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Aucun événement à venir
            </p>
          </div>
        ) : (
          events.slice(0, 5).map((event) => {
            const colors = colorMap[event.color] ?? colorMap.blue;
            const dateStr = format(new Date(event.start_at), "d MMM · HH:mm", {
              locale: fr,
            });

            return (
              <div
                key={event.id}
                className={cn(
                  "flex overflow-hidden rounded-lg transition-colors",
                  colors.bg
                )}
              >
                <div className={cn("w-1 shrink-0", colors.bar)} />
                <div className="flex flex-1 items-center px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--heading)]">
                      {event.title}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
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
