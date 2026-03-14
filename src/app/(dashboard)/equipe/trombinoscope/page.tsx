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
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Trombinoscope
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          L&apos;annuaire de tous les collaborateurs INNOVTEC R&eacute;seaux.
        </p>
      </div>

      <TrombinoscopeGrid
        users={users}
        birthdayIds={Array.from(birthdayIds)}
        currentUserId={profile?.id ?? ""}
      />
    </div>
  );
}
