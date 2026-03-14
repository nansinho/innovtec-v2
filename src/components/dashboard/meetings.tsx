import { Card, CardHeader } from "@/components/ui/card";
import { Clock, CalendarX } from "lucide-react";
import { getTodayEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function Meetings() {
  const events = await getTodayEvents();

  return (
    <Card>
      <CardHeader title="Réunions du jour" />
      <div className="space-y-2 px-4 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CalendarX className="mb-2 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-[var(--text-muted)]">
              Aucune réunion aujourd&apos;hui
            </p>
          </div>
        ) : (
          events.map((event) => {
            const startTime = format(new Date(event.start_at), "HH:mm", { locale: fr });
            const endTime = event.end_at
              ? format(new Date(event.end_at), "HH:mm", { locale: fr })
              : null;
            const timeLabel = endTime ? `${startTime} — ${endTime}` : startTime;

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border-1)] p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-zinc-100">
                  <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--heading)]">
                    {event.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{timeLabel}</span>
                    {event.location && (
                      <>
                        <span>·</span>
                        <span>{event.location}</span>
                      </>
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
