"use client";

import { useState } from "react";
import { ImageIcon, Palette, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoSettings from "@/components/admin/logo-settings";
import ThemeSettings from "@/components/admin/theme-settings";
import ApiKeySettings from "@/components/admin/api-key-settings";
import type { CompanyLogos } from "@/actions/settings";

const tabs = [
  { id: "branding", label: "Identité visuelle", icon: ImageIcon },
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "integrations", label: "Intégrations", icon: Key },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface AdminSettingsTabsProps {
  logos: CompanyLogos;
  apiSettings: { hasKey: boolean; maskedKey: string } | null;
}

export default function AdminSettingsTabs({
  logos,
  apiSettings,
}: AdminSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("branding");

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--border-1)] bg-[var(--hover)] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-[var(--heading)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl">
        {activeTab === "branding" && <LogoSettings logos={logos} />}
        {activeTab === "appearance" && <ThemeSettings />}
        {activeTab === "integrations" && (
          <ApiKeySettings
            hasKey={apiSettings?.hasKey ?? false}
            maskedKey={apiSettings?.maskedKey ?? ""}
          />
        )}
      </div>
    </div>
  );
}
