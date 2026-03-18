import { getProfile } from "@/actions/auth";
import { getApiSettings, getCompanyLogo } from "@/actions/settings";
import { redirect } from "next/navigation";
import AdminSettingsTabs from "@/components/admin/admin-settings-tabs";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";


export default async function AdminSettingsPage() {
  const profile = await getProfile();

  if (!profile) redirect("/");
  const canManageSettings = await hasPermission(profile.role, profile.job_title || "", PERMISSIONS.MANAGE_SETTINGS);
  if (!canManageSettings) redirect("/");

  const [apiSettings, logos] = await Promise.all([
    getApiSettings(),
    getCompanyLogo(),
  ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <h1 className="mb-1 text-lg font-semibold text-[var(--heading)]">
        Paramètres
      </h1>
      <p className="mb-6 text-[13px] text-[var(--text-secondary)]">
        Configuration générale de l&apos;intranet.
      </p>

      <AdminSettingsTabs
        logos={logos}
        apiSettings={apiSettings}
      />
    </div>
  );
}
