import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MobileNav from "@/components/layout/mobile-nav";
import { getProfile } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <>
      <Sidebar profile={profile} />
      <div className="min-h-screen md:ml-[var(--sidebar-width)]">
        <Topbar profile={profile} />
        {children}
      </div>
      <MobileNav />
    </>
  );
}
