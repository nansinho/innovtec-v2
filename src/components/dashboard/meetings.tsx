import { Card, CardHeader } from "@/components/ui/card";
import { Clock, CalendarX, Video } from "lucide-react";
import { getTodayEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function Meetings() {
  const events = await getTodayEvents();

  return (
    <Card>
      <CardHeader title="Réunions du jour" icon={Video} />
      <div className="space-y-1.5 px-3 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <CalendarX className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
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
                className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {event.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-600">{timeLabel}</span>
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
