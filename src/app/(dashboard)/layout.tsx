import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MobileNav from "@/components/layout/mobile-nav";
import BirthdayPopupWrapper from "@/components/birthday/birthday-popup-wrapper";
import { getProfile } from "@/actions/auth";
import { getUnreadCount } from "@/actions/notifications";
import { isMyBirthday, getMyBirthdayWishes } from "@/actions/birthday";
import { ensureAdminExists } from "@/actions/users";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  // Auto-promote first user to admin if no admin exists
  if (profile) {
    const adminCheck = await ensureAdminExists();
    if (adminCheck.promoted) {
      // Profile role was updated — redirect to refresh the layout
      redirect("/");
    }
  }

  const unreadCount = await getUnreadCount();
  const isBirthday = await isMyBirthday();
  const wishes = isBirthday ? await getMyBirthdayWishes() : [];

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Collaborateur";

  return (
    <>
      <Sidebar profile={profile} />
      <div className="min-h-screen md:ml-[var(--sidebar-width)]">
        <Topbar profile={profile} unreadCount={unreadCount} />
        {children}
      </div>
      <MobileNav />
      {isBirthday && (
        <BirthdayPopupWrapper wishes={wishes} userName={userName} />
      )}
    </>
  );
}
