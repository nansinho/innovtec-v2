import { ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { getUpcomingEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Voir tous les événements"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-1.5 px-3 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <CalendarDays className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              Aucun événement à venir
            </p>
          </div>
        ) : (
          events.slice(0, 5).map((event) => {
            const dateStr = format(new Date(event.start_at), "d MMM · HH:mm", {
              locale: fr,
            });

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="w-1 shrink-0 self-stretch rounded-full bg-gray-300" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {event.title}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {dateStr}
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
