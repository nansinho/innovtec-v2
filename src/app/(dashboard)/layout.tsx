import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MobileNav from "@/components/layout/mobile-nav";
import BirthdayPopupWrapper from "@/components/birthday/birthday-popup-wrapper";
import PasswordChangeAlert from "@/components/profil/password-change-alert";
import NotificationProvider from "@/components/notifications/notification-provider";
import { getProfile } from "@/actions/auth";
import { getUnreadCountForUser } from "@/actions/notifications";
import { isUserBirthday, getBirthdayWishesForUser } from "@/actions/birthday";
import { ensureAdminExists } from "@/actions/users";
import { getCompanyLogo } from "@/actions/settings";
import { redirect } from "next/navigation";

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
      redirect("/");
    }
  }

  const userId = profile?.id ?? "";

  // Fetch all layout data in parallel — no extra auth calls
  const [unreadCount, isBirthday, logos] = await Promise.all([
    userId ? getUnreadCountForUser(userId) : Promise.resolve(0),
    userId ? isUserBirthday(userId) : Promise.resolve(false),
    getCompanyLogo(),
  ]);
  const wishes = isBirthday ? await getBirthdayWishesForUser(userId) : [];

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Collaborateur";

  return (
    <NotificationProvider userId={profile?.id ?? ""} initialCount={unreadCount}>
      <Sidebar profile={profile} logos={logos} />
      <div className="min-h-screen transition-all duration-300 ease-out md:ml-[var(--sidebar-width)]">
        <Topbar profile={profile} />
        <main>{children}</main>
      </div>
      <MobileNav />
      {profile?.must_change_password && <PasswordChangeAlert />}
      {isBirthday && (
        <BirthdayPopupWrapper wishes={wishes} userName={userName} />
      )}
    </NotificationProvider>
  );
}
