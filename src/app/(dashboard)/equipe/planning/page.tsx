import { getUpcomingEvents, getTodayEvents, getMonthEvents } from "@/actions/events";
import { getTodayBirthdays, getUpcomingBirthdays } from "@/actions/birthday";
import PlanningView from "@/components/equipe/planning-view";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const now = new Date();
  const [events, todayEvents, monthEvents, todayBirthdays, upcomingBirthdays] =
    await Promise.all([
      getUpcomingEvents(),
      getTodayEvents(),
      getMonthEvents(now.getFullYear(), now.getMonth() + 1),
      getTodayBirthdays(),
      getUpcomingBirthdays(30),
    ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Planning
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Visualisez les réunions, événements et anniversaires de l&apos;équipe.
        </p>
      </div>

      <PlanningView
        events={monthEvents}
        todayEventsCount={todayEvents.length}
        upcomingEventsCount={events.length}
        todayBirthdays={todayBirthdays.map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth!,
          avatar_url: p.avatar_url ?? undefined,
        }))}
        upcomingBirthdays={upcomingBirthdays.map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth!,
          avatar_url: p.avatar_url ?? undefined,
        }))}
      />
    </div>
  );
}
