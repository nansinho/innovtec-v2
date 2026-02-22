import { Card, CardHeader } from "@/components/ui/card";
import { getTodayEvents } from "@/actions/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function Meetings() {
  const events = await getTodayEvents();

  return (
    <Card>
      <CardHeader title="Réunions du jour" />
      <div className="space-y-2.5 px-4 py-2.5">
        {events.length === 0 ? (
          <div className="py-4 text-center text-[12px] text-[var(--text-muted)]">
            Aucune réunion aujourd'hui
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
                className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--bg)] p-4"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {event.location || "Non précisé"}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeLabel}
                  </span>
                </div>
                <div className="mb-2 text-[13px] font-medium text-[var(--heading)]">
                  {event.title}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
