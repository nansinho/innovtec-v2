import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MobileNav from "@/components/layout/mobile-nav";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="min-h-screen md:ml-[var(--sidebar-width)]">
        <Topbar />
        {children}
      </div>
      <MobileNav />
    </>
  );
}
