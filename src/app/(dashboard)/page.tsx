import WelcomeCarousel from "@/components/dashboard/welcome-carousel";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [birthdays, profile] = await Promise.all([
    getTodayBirthdays(),
    getProfile(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 px-7 py-4 pb-20 md:pb-7 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="flex flex-col gap-5">
        <WelcomeCarousel />

        {/* Birthday banner if someone has birthday today */}
        {birthdays.length > 0 && profile && (
          <BirthdayBanner
            birthdays={birthdays}
            currentUserId={profile.id}
          />
        )}

        {/* Widgets row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TodoList />
          <RecentDocs />
        </div>

        <Feed />
        <GalleryGrid />
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        <QuickLinks />
        <EventsList />
        <Meetings />
        <Timebit />
      </div>
    </div>
  );
}
