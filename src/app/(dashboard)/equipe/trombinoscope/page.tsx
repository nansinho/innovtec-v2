import { getTrombinoscopeUsers } from "@/actions/trombinoscope";
import { getTodayBirthdays } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import TrombinoscopeTable from "@/components/equipe/trombinoscope-table";

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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Trombinoscope
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          L&apos;annuaire de tous les collaborateurs INNOVTEC Réseaux.
        </p>
      </div>

      <TrombinoscopeTable
        users={users}
        birthdayIds={Array.from(birthdayIds)}
        currentUserId={profile?.id ?? ""}
      />
    </div>
  );
}
