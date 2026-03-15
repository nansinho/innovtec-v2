import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayBirthdays } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import TrombinoscopeGrid from "@/components/equipe/trombinoscope-grid";

export const dynamic = "force-dynamic";

export default async function TrombinoscopePage() {
  const [users, birthdays, profile] = await Promise.all([
    getTrombinoscopeUsers(),
    getTodayBirthdays(),
    getProfile(),
  ]);

  const birthdayIds = new Set(birthdays.map((b) => b.id));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <TrombinoscopeGrid
        users={users}
        birthdayIds={Array.from(birthdayIds)}
        currentUserId={profile?.id ?? ""}
      />
    </div>
  );
}
