import { getProfile } from "@/actions/auth";
import { getActionPlans } from "@/actions/action-plans";
import { getSignalements } from "@/actions/signalements";
import { getAllUsers } from "@/actions/users";
import PlansPageClient from "./page-client";

export const dynamic = "force-dynamic";

export default async function PlansActionsPage() {
  const [profile, plans, signalements, users] = await Promise.all([
    getProfile(),
    getActionPlans(),
    getSignalements(),
    getAllUsers(),
  ]);

  const canManage =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  const unresolvedSignalements = signalements
    .filter((s) => s.status !== "resolu" && s.status !== "cloture")
    .map((s) => ({ id: s.id, title: s.title, priority: s.priority }));

  const profiles = users
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name }));

  return (
    <PlansPageClient
      plans={plans}
      canManage={canManage}
      profiles={profiles}
      unresolvedSignalements={unresolvedSignalements}
    />
  );
}
