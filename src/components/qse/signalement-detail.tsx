"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updateSignalementStatus, assignSignalement } from "@/actions/signalements";
import { linkSignalement } from "@/actions/action-plans";
import type { DangerReport, ActionPlan, Profile } from "@/lib/types/database";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "error" | "warning" | "success" | "default" }> = {
  signale: { label: "Signalé", variant: "error" },
  en_cours: { label: "En cours", variant: "warning" },
  resolu: { label: "Résolu", variant: "success" },
  cloture: { label: "Clôturé", variant: "default" },
};

const priorityConfig: Record<string, { label: string; variant: "error" | "warning" | "info" | "default" }> = {
  faible: { label: "Faible", variant: "default" },
  moyenne: { label: "Moyenne", variant: "info" },
  haute: { label: "Haute", variant: "warning" },
  critique: { label: "Critique", variant: "error" },
};

interface SignalementDetailProps {
  signalement: DangerReport;
  canManage: boolean;
  actionPlans: ActionPlan[];
  profiles: Pick<Profile, "id" | "first_name" | "last_name">[];
}

export default function SignalementDetail({
  signalement: initial,
  canManage,
  actionPlans,
  profiles,
}: SignalementDetailProps) {
  const router = useRouter();
  const [signalement, setSignalement] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const st = statusConfig[signalement.status] ?? statusConfig.signale;
  const pri = priorityConfig[signalement.priority] ?? priorityConfig.faible;
  const cat = signalement.category as { name: string; color: string } | null;
  const photos = signalement.photo_urls?.length > 0 ? signalement.photo_urls : signalement.photo_url ? [signalement.photo_url] : [];

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateSignalementStatus(signalement.id, newStatus as DangerReport["status"]);
      if (result.success) {
        setSignalement((prev) => ({ ...prev, status: newStatus as DangerReport["status"] }));
        toast.success("Statut mis à jour");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  }

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignSignalement(signalement.id, userId);
      if (result.success) {
        const assigned = profiles.find((p) => p.id === userId);
        setSignalement((prev) => ({
          ...prev,
          assigned_to: userId,
          assignee: assigned ? { first_name: assigned.first_name, last_name: assigned.last_name } : null,
        }));
        toast.success("Signalement assigné");
      }
    });
  }

  function handleLinkPlan(planId: string) {
    startTransition(async () => {
      const result = await linkSignalement(planId, signalement.id);
      if (result.success) {
        setSignalement((prev) => ({ ...prev, status: "resolu", action_plan_id: planId }));
        toast.success("Signalement lié au plan d'action et résolu");
      }
    });
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/qse/signalements")}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux signalements
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{signalement.title}</h1>
              <Badge variant={st.variant}>{st.label}</Badge>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <Badge variant={pri.variant}>{pri.label}</Badge>
              {cat && (
                <Badge variant="default">{cat.name}</Badge>
              )}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                {signalement.incident_date
                  ? new Date(signalement.incident_date).toLocaleDateString("fr-FR")
                  : new Date(signalement.created_at).toLocaleDateString("fr-FR")}
              </div>
              {signalement.incident_time && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {signalement.incident_time.slice(0, 5)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-gray-400" />
                {signalement.chantier || signalement.location || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {signalement.is_anonymous ? (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-400" />
                    <span className="italic">Anonyme</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-gray-400" />
                    {signalement.reporter
                      ? `${signalement.reporter.first_name} ${signalement.reporter.last_name}`
                      : "—"}
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500">
                {signalement.description}
              </p>
            </div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="aspect-square overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">
              Suivi du signalement
            </h3>
            <div className="flex items-center gap-0">
              {(["signale", "en_cours", "resolu"] as const).map((step, i) => {
                const stepConf = statusConfig[step];
                const isActive =
                  step === signalement.status ||
                  (step === "signale" && ["en_cours", "resolu", "cloture"].includes(signalement.status)) ||
                  (step === "en_cours" && ["resolu", "cloture"].includes(signalement.status));
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                          isActive
                            ? "border-emerald-500 text-emerald-500"
                            : "border-gray-200 text-gray-400"
                        )}
                      >
                        {isActive ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </div>
                      <span className="mt-1.5 text-[11px] font-medium text-gray-400">
                        {stepConf.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1",
                          isActive ? "bg-emerald-500" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar — actions for QSE manager */}
        {canManage && (
          <div className="space-y-4">
            {/* Status */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Changer le statut
              </h3>
              <select
                value={signalement.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="signale">Signalé</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
                <option value="cloture">Clôturé</option>
              </select>
            </div>

            {/* Assign */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Assigner à
              </h3>
              <select
                value={signalement.assigned_to ?? ""}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Non assigné</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
              {signalement.assignee && (
                <p className="mt-2 text-xs text-gray-400">
                  Actuellement : {signalement.assignee.first_name} {signalement.assignee.last_name}
                </p>
              )}
            </div>

            {/* Link to action plan */}
            {!signalement.action_plan_id && actionPlans.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Lier à un plan d&apos;action
                </h3>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleLinkPlan(e.target.value);
                  }}
                  disabled={isPending}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Sélectionner un plan...</option>
                  {actionPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Linked plan */}
            {signalement.action_plan_id && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Plan d&apos;action lié
                </h3>
                <button
                  onClick={() => router.push(`/qse/plans/${signalement.action_plan_id}`)}
                  className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  Voir le plan d&apos;action
                </button>
              </div>
            )}

            {isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mise à jour...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={photos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === lightboxIndex ? "bg-white" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
