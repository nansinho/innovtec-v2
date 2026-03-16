"use client";

import { useState, useTransition, useRef } from "react";
import {
  X,
  Send,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSignalement, uploadSignalementPhoto } from "@/actions/signalements";
import type { SignalementCategory, SignalementPriority } from "@/lib/types/database";
import { toast } from "sonner";

interface SignalementFormProps {
  categories: SignalementCategory[];
  onCreated: () => void;
  onClose: () => void;
}

const priorityOptions: { value: SignalementPriority; label: string; color: string }[] = [
  { value: "faible", label: "Faible", color: "text-gray-600 border-gray-300 bg-gray-50" },
  { value: "moyenne", label: "Moyenne", color: "text-blue-700 border-blue-300 bg-blue-50" },
  { value: "haute", label: "Haute", color: "text-amber-700 border-amber-300 bg-amber-50" },
  { value: "critique", label: "Critique", color: "text-red-700 border-red-300 bg-red-50" },
];

export default function SignalementForm({ categories, onCreated, onClose }: SignalementFormProps) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    priority: "moyenne" as SignalementPriority,
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "",
    chantier: "",
    is_anonymous: true,
    certified: false,
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handlePhotoUpload(files: FileList | null) {
    if (!files) return;

    const remaining = 5 - photoUrls.length;
    if (remaining <= 0) {
      toast.error("Maximum 5 photos");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    for (const file of filesToUpload) {
      const previewUrl = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadSignalementPhoto(formData);
      if (result.success && result.url) {
        setPhotoUrls((prev) => [...prev, result.url!]);
        setPhotoPreviews((prev) => [...prev, previewUrl]);
      } else {
        URL.revokeObjectURL(previewUrl);
        toast.error(result.error || "Erreur upload");
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    if (!form.category_id) {
      setError("La catégorie est obligatoire");
      return;
    }
    if (!form.description.trim()) {
      setError("La description est obligatoire");
      return;
    }
    if (!form.incident_date) {
      setError("La date de l'incident est obligatoire");
      return;
    }
    if (!form.certified) {
      setError("Vous devez certifier l'exactitude des faits");
      return;
    }

    setError("");
    startTransition(async () => {
      const { certified: _, ...formData } = form;
      const result = await createSignalement({
        ...formData,
        photo_urls: photoUrls,
      });

      if (result.success) {
        toast.success("Signalement envoyé avec succès");
        onCreated();
      } else {
        setError(result.error || "Erreur lors de l'envoi");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white md:left-[var(--sidebar-width)]">
      <div className="relative flex h-full w-full flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Déclarer une situation dangereuse
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Anonymous toggle */}
          <label
            onClick={() => setForm({ ...form, is_anonymous: !form.is_anonymous })}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
          >
            <div
              className={cn(
                "flex h-5 w-9 items-center rounded-full transition-colors",
                form.is_anonymous ? "bg-orange-600" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  form.is_anonymous ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                Signaler de manière anonyme
              </span>
            </div>
          </label>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Titre du signalement <span className="text-red-600">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Décrivez brièvement la situation"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Catégorie <span className="text-red-600">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Priorité <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: opt.value })}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-all",
                      form.priority === opt.value
                        ? opt.color
                        : "border-gray-200 text-gray-400 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Date de l&apos;incident <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={form.incident_date}
                onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Heure de l&apos;incident
              </label>
              <input
                type="time"
                value={form.incident_time}
                onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Location / Chantier */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Lieu / Chantier <span className="text-red-600">*</span>
            </label>
            <input
              value={form.chantier}
              onChange={(e) => setForm({ ...form, chantier: e.target.value })}
              className={inputClass}
              placeholder="Ex: Chantier Bordeaux, Bureau principal..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className={cn(inputClass, "resize-none")}
              placeholder="Décrivez la situation dangereuse en détail : ce qui s'est passé, les circonstances, les risques identifiés..."
            />
          </div>

          {/* Photos */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Photos ({photoUrls.length}/5)
            </label>

            {/* Photo previews */}
            {photoPreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photoPreviews.map((previewUrl, i) => (
                  <div key={i} className="group relative">
                    <img
                      src={previewUrl}
                      alt={`Photo ${i + 1}`}
                      className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photoUrls.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {uploading ? "Upload en cours..." : "Ajouter des photos"}
                </button>
              </div>
            )}
          </div>

          {/* Certification */}
          <label
            onClick={() => setForm({ ...form, certified: !form.certified })}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
          >
            <div
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                form.certified
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-300"
              )}
            >
              {form.certified && (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Je certifie sur l&apos;honneur l&apos;exactitude des faits décrits dans ce signalement.
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-4">
          {/* Rappel mode anonyme/public */}
          <div className="mr-auto flex items-center gap-2 text-sm text-gray-400">
            {form.is_anonymous ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Signalement anonyme</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Votre identité sera visible</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || uploading}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Envoi..." : "Envoyer le signalement"}
          </button>
        </div>
      </div>
    </div>
  );
}
