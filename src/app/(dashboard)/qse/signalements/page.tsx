import { getProfile } from "@/actions/auth";
import { getSignalements, getSignalementCategories, getMySignalements } from "@/actions/signalements";
import SignalementPageClient from "./page-client";

export const dynamic = "force-dynamic";

export default async function SignalementsPage() {
  const [profile, signalements, categories, mySignalements] = await Promise.all([
    getProfile(),
    getSignalements(),
    getSignalementCategories(),
    getMySignalements(),
  ]);

  const canManage =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <SignalementPageClient
      signalements={signalements}
      categories={categories}
      mySignalements={mySignalements}
      canManage={canManage}
    />
  );
}
