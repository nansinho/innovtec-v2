import { getUpcomingEvents } from "@/actions/events";
import PlanningView from "@/components/equipe/planning-view";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const events = await getUpcomingEvents();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Planning
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Le planning des équipes et des chantiers.
        </p>
      </div>

      <PlanningView events={events} />
    </div>
  );
}
