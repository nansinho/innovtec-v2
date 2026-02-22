import { getNewsWithViewCounts } from "@/actions/news";
import { getTodayBirthdays } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import NewsGrid from "@/components/news/news-grid";
import BirthdayBanner from "@/components/birthday/birthday-banner";

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  const [news, birthdays, profile] = await Promise.all([
    getNewsWithViewCounts(),
    getTodayBirthdays(),
    getProfile(),
  ]);

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Actualités
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Les dernières nouvelles de l&apos;entreprise
        </p>
      </div>

      {/* Birthday banner */}
      {birthdays.length > 0 && profile && (
        <div className="mb-6">
          <BirthdayBanner
            birthdays={birthdays}
            currentUserId={profile.id}
          />
        </div>
      )}

      {/* News grid */}
      <NewsGrid news={news} />
    </div>
  );
}
