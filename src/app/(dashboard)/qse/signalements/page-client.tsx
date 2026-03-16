"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, User } from "lucide-react";
import { cn } from "@/lib/utils";
import SignalementForm from "@/components/qse/signalement-form";
import SignalementList from "@/components/qse/signalement-list";
import MesSignalements from "@/components/qse/mes-signalements";
import type { DangerReport, SignalementCategory } from "@/lib/types/database";

interface Props {
  signalements: DangerReport[];
  categories: SignalementCategory[];
  mySignalements: DangerReport[];
  canManage: boolean;
}

export default function SignalementPageClient({
  signalements,
  categories,
  mySignalements,
  canManage,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"all" | "mine">(canManage ? "all" : "mine");
  const router = useRouter();

  return (
    <div className="px-8 py-6 pb-20 md:pb-6">
      {/* Tabs — pill style */}
      <div className="mb-6 flex items-center gap-2">
        {canManage && (
          <button
            onClick={() => setTab("all")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              tab === "all"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <List className="h-3.5 w-3.5" />
            Tous les signalements
            {signalements.length > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                tab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 text-gray-600"
              )}>
                {signalements.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "mine"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <User className="h-3.5 w-3.5" />
          Mes signalements
          {mySignalements.length > 0 && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              tab === "mine"
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-600"
            )}>
              {mySignalements.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tab === "all" && canManage ? (
        <SignalementList
          signalements={signalements}
          categories={categories}
          canManage={canManage}
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <MesSignalements signalements={mySignalements} />
      )}

      {/* Form modal */}
      {showForm && (
        <SignalementForm
          categories={categories}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
