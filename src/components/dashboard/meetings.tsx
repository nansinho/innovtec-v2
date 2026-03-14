import { Card, CardHeader } from "@/components/ui/card";
import { Clock, CalendarX, Video } from "lucide-react";
import { getTodayEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function Meetings() {
  const events = await getTodayEvents();

  return (
    <Card>
      <CardHeader title="R\u00e9unions du jour" icon={Video} />
      <div className="space-y-1.5 px-3 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <CalendarX className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Aucune r\u00e9union aujourd&apos;hui
            </p>
          </div>
        ) : (
          events.map((event) => {
            const startTime = format(new Date(event.start_at), "HH:mm", { locale: fr });
            const endTime = event.end_at
              ? format(new Date(event.end_at), "HH:mm", { locale: fr })
              : null;
            const timeLabel = endTime ? `${startTime} \u2014 ${endTime}` : startTime;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-lg bg-zinc-50/80 px-3 py-2.5 transition-colors hover:bg-zinc-100/80"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--heading)]">
                    {event.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700">{timeLabel}</span>
                    {event.location && (
                      <span className="truncate">{event.location}</span>
                    )}
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
