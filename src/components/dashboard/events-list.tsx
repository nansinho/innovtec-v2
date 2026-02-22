import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUpcomingEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventColor } from "@/lib/types/database";

const colorMap: Record<string, { bg: string; bar: string }> = {
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
  red: {
    bg: "bg-[rgba(239,68,68,0.04)]",
    bar: "bg-[var(--red)]",
  },
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
            className="flex items-center text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="space-y-2 px-4 py-2">
        {events.length === 0 ? (
          <div className="py-4 text-center text-[12px] text-[var(--text-muted)]">
            Aucun événement à venir
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
                  "flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)]",
                  colors.bg
                )}
              >
                <div className={cn("w-1 shrink-0", colors.bar)} />
                <div className="flex flex-1 items-center justify-between px-3 py-2.5">
                  <div>
                    <div className="text-[12.5px] font-medium text-[var(--heading)]">
                      {event.title}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-muted)]">
                      {dateStr}
                    </div>
                  </div>
                  <button className="px-2 py-2.5 text-sm text-[var(--text-muted)]">
                    ···
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
