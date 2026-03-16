import WelcomeCarousel from "@/components/dashboard/welcome-carousel";
import KpiCards from "@/components/dashboard/kpi-cards";
import TodoList from "@/components/dashboard/todo-list";
import RecentDocs from "@/components/dashboard/recent-docs";
import Feed from "@/components/dashboard/feed";
import GalleryGrid from "@/components/dashboard/gallery-grid";
import QuickLinks from "@/components/dashboard/quick-links";
import EventsList from "@/components/dashboard/events-list";
import Meetings from "@/components/dashboard/meetings";
import Timebit from "@/components/dashboard/timebit";
import BirthdayBanner from "@/components/birthday/birthday-banner";
import { getTodayBirthdays } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [birthdays, profile] = await Promise.all([
    getTodayBirthdays(),
    getProfile(),
  ]);

  const today = new Date();
  const dateStr = format(today, "EEEE d MMMM yyyy", { locale: fr });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : "Utilisateur";

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-[13px] font-medium text-zinc-400">{dateFormatted}</p>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--heading)]">
          Bonjour, {displayName}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_var(--right-width)]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          <WelcomeCarousel />

          {birthdays.length > 0 && profile && (
            <BirthdayBanner
              birthdays={birthdays}
              currentUserId={profile.id}
            />
          )}

          <KpiCards />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TodoList />
            <RecentDocs />
          </div>

          <Feed />
          <GalleryGrid />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <QuickLinks />
          <EventsList />
          <Meetings />
          <Timebit />
        </div>
      </div>
    </div>
  );
}
