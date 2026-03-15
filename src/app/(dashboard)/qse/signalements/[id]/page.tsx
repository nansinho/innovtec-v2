import { notFound } from "next/navigation";
import { getProfile } from "@/actions/auth";
import { getSignalement } from "@/actions/signalements";
import { getActionPlans } from "@/actions/action-plans";
import { getAllUsers } from "@/actions/users";
import SignalementDetail from "@/components/qse/signalement-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SignalementDetailPage({ params }: Props) {
  const { id } = await params;

  const [profile, signalement, actionPlans, users] = await Promise.all([
    getProfile(),
    getSignalement(id),
    getActionPlans(),
    getAllUsers(),
  ]);

  if (!signalement) {
    notFound();
  }

  const canManage =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  const profiles = users
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name }));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <SignalementDetail
        signalement={signalement}
        canManage={canManage}
        actionPlans={actionPlans}
        profiles={profiles}
      />
    </div>
  );
}
