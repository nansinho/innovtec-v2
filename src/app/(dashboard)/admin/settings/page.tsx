import { getProfile } from "@/actions/auth";
import { getApiSettings } from "@/actions/settings";
import { redirect } from "next/navigation";
import ApiKeySettings from "@/components/admin/api-key-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const profile = await getProfile();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    redirect("/");
  }

  const apiSettings = await getApiSettings();

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 text-xl font-semibold text-[var(--heading)]">
        Paramètres
      </h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Configuration générale de l&apos;intranet.
      </p>

      <div className="max-w-2xl space-y-6">
        <ApiKeySettings
          hasKey={apiSettings?.hasKey ?? false}
          maskedKey={apiSettings?.maskedKey ?? ""}
        />
      </div>
    </div>
  );
}
