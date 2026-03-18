import { notFound } from "next/navigation";
import { getProfile } from "@/actions/auth";
import { getActionPlan } from "@/actions/action-plans";
import { getSignalements } from "@/actions/signalements";
import ActionPlanDetail from "@/components/qse/action-plan-detail";


interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActionPlanDetailPage({ params }: Props) {
  const { id } = await params;

  const [profile, plan, signalements] = await Promise.all([
    getProfile(),
    getActionPlan(id),
    getSignalements(),
  ]);

  if (!plan) {
    notFound();
  }

  const canManage =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  const unresolvedSignalements = signalements
    .filter((s) => s.status !== "resolu" && s.status !== "cloture" && !s.action_plan_id)
    .map((s) => ({ id: s.id, title: s.title, priority: s.priority }));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <ActionPlanDetail
        plan={plan}
        canManage={canManage}
        unresolvedSignalements={unresolvedSignalements}
      />
    </div>
  );
}
