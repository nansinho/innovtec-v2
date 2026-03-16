"use client";

import { useState, useTransition } from "react";
import {
  X,
  Send,
  Upload,
  Sparkles,
  PenLine,
  BookOpen,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { createBonnePratique, uploadBonnePratiquePhoto } from "@/actions/bonnes-pratiques";
import { toast } from "sonner";
import AiGenerateButton from "@/components/ai/ai-generate-button";
import FileUploadAi from "@/components/ai/file-upload-ai";
import RichTextEditor from "@/components/news/rich-text-editor";

type Mode = "import" | "ai" | "manual";

const PILLARS = [
  { key: "qualite", label: "Qualité" },
  { key: "sante", label: "Santé" },
  { key: "securite", label: "Sécurité" },
  { key: "environnement", label: "Environnement" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Non défini" },
  { value: "facile", label: "Facile" },
  { value: "moyenne", label: "Moyenne" },
  { value: "difficile", label: "Difficile" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Non défini" },
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "elevee", label: "Élevée" },
];

const IMPACT_OPTIONS = [
  { value: "", label: "Non défini" },
  { value: "aucun", label: "-" },
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "eleve", label: "Élevé" },
];

interface BonnePratiqueFormProps {
  onCreated: () => void;
  onClose: () => void;
}

interface FormData {
  title: string;
  pillar: string;
  category: string;
  description: string;
  chantier: string;
  cover_photo: string;
  photos: string[];
  difficulty: string;
  priority: string;
  cost_impact: string;
  environmental_impact: string;
  safety_impact: string;
  source_file_url: string;
}

const emptyForm: FormData = {
  title: "",
  pillar: "securite",
  category: "",
  description: "",
  chantier: "",
  cover_photo: "",
  photos: [],
  difficulty: "",
  priority: "",
  cost_impact: "",
  environmental_impact: "",
  safety_impact: "",
  source_file_url: "",
};

export default function BonnePratiqueForm({ onCreated, onClose }: BonnePratiqueFormProps) {
  const [mode, setMode] = useState<Mode>("import");
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploadingCover, setUploadingCover] = useState(false);

  const inputClass =
    "w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-surface)]";

  function handleAiImportComplete(result: unknown, fileUrl?: string) {
    const r = result as Record<string, unknown>;
    setForm({
      title: (r.title as string) || "",
      pillar: (r.pillar as string) || "securite",
      category: (r.category as string) || "",
      description: (r.description as string) || "",
      chantier: (r.chantier as string) || "",
      cover_photo: "",
      photos: [],
      difficulty: (r.difficulty as string) || "",
      priority: (r.priority as string) || "",
      cost_impact: (r.cost_impact as string) || "",
      environmental_impact: (r.environmental_impact as string) || "",
      safety_impact: (r.safety_impact as string) || "",
      source_file_url: fileUrl || "",
    });
    setMode("manual");
    toast.success("Bonne pratique analysée par l'IA — vérifiez et complétez les champs");
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "bonne_pratique" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur IA");
        return;
      }
      const r = data.result;
      setForm((prev) => ({
        ...prev,
        title: r.title || "",
        pillar: r.pillar || "securite",
        category: r.category || "",
        description: r.description || "",
        chantier: r.chantier || "",
        difficulty: r.difficulty || "",
        priority: r.priority || "",
        cost_impact: r.cost_impact || "",
        environmental_impact: r.environmental_impact || "",
        safety_impact: r.safety_impact || "",
      }));
      setMode("manual");
      toast.success("Bonne pratique générée par l'IA");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.photos.length + files.length > 5) {
      toast.error("Maximum 5 photos autorisées");
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadBonnePratiquePhoto(fd);
      if (result.error) {
        toast.error(`Erreur upload: ${result.error}`);
      } else if (result.filePath) {
        newPhotos.push(result.filePath);
      }
    }

    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  async function handleCoverPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadBonnePratiquePhoto(fd);
    if (result.error) {
      toast.error(`Erreur upload: ${result.error}`);
    } else if (result.filePath) {
      setForm((prev) => ({ ...prev, cover_photo: result.filePath! }));
    }
    setUploadingCover(false);
    e.target.value = "";
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    const descriptionText = form.description.replace(/<[^>]*>/g, "").trim();
    if (!descriptionText) {
      toast.error("La description est obligatoire");
      return;
    }

    startTransition(async () => {
      const result = await createBonnePratique(form);
      if (result.success) {
        toast.success("Bonne pratique enregistrée");
        onCreated();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    });
  }

  const modeButtons = [
    { key: "import" as Mode, icon: Upload, label: "Importer un document" },
    { key: "ai" as Mode, icon: Sparkles, label: "Générer par IA" },
    { key: "manual" as Mode, icon: PenLine, label: "Saisie manuelle" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--card)] md:left-[var(--sidebar-width)]">
      <div className="relative flex h-full w-full flex-col bg-[var(--card)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--green)]" />
            <h2 className="text-lg font-semibold text-[var(--heading)]">
              Nouvelle bonne pratique
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode selector */}
            <div className="flex gap-1">
              {modeButtons.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                    mode === key
                      ? "bg-[var(--green)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--hover)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Mode: Import */}
          {mode === "import" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Importez un document de bonne pratique (PDF ou image) et l&apos;IA extraira automatiquement toutes les informations.
              </p>
              <FileUploadAi
                onAnalysisComplete={handleAiImportComplete}
                type="bonne_pratique"
                label="Importer une bonne pratique"
              />
            </div>
          )}

          {/* Mode: AI Generate */}
          {mode === "ai" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Décrivez la bonne pratique à générer
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Bonne pratique pour le port des EPI sur les chantiers de pose de fibre optique, incluant les gants, lunettes et casque..."
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <AiGenerateButton
                onClick={handleAiGenerate}
                loading={aiLoading}
                disabled={!aiPrompt.trim()}
                label="Générer la bonne pratique"
              />
            </div>
          )}

          {/* Mode: Manual (also shown after AI import/generate) */}
          {mode === "manual" && (
            <div className="space-y-5">
              {/* Photo de couverture */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Photo de couverture
                </label>
                {form.cover_photo ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${form.cover_photo}`}
                      alt="Photo de couverture"
                      className="h-48 w-full rounded-[var(--radius)] object-cover"
                    />
                    <button
                      onClick={() => setForm({ ...form, cover_photo: "" })}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-[var(--border-1)] bg-[var(--hover)] px-6 py-8 text-center transition-colors hover:border-[var(--green)] hover:bg-[var(--green-surface)]">
                    <ImagePlus className="h-8 w-8 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {uploadingCover ? "Envoi en cours..." : "Ajouter une photo de couverture"}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Cette image sera affichée sur la carte de la bonne pratique
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoUpload}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </label>
                )}
              </div>

              {/* Titre */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Titre *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  placeholder="Titre de la bonne pratique"
                />
              </div>

              {/* Pilier + Catégorie */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Pilier QSE *
                  </label>
                  <select
                    value={form.pillar}
                    onChange={(e) => setForm({ ...form, pillar: e.target.value })}
                    className={inputClass}
                  >
                    {PILLARS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Catégorie
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: EPI, signalisation..."
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Description *
                </label>
                <RichTextEditor
                  content={form.description}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="Décrivez en détail la bonne pratique, son contexte et ses bénéfices..."
                />
              </div>

              {/* Difficulté + Priorité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Difficulté
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className={inputClass}
                  >
                    {DIFFICULTY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Priorité
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className={inputClass}
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Impacts */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Impact sur les coûts
                  </label>
                  <select
                    value={form.cost_impact}
                    onChange={(e) => setForm({ ...form, cost_impact: e.target.value })}
                    className={inputClass}
                  >
                    {IMPACT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Impact environnemental
                  </label>
                  <select
                    value={form.environmental_impact}
                    onChange={(e) => setForm({ ...form, environmental_impact: e.target.value })}
                    className={inputClass}
                  >
                    {IMPACT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Impact sécurité
                  </label>
                  <select
                    value={form.safety_impact}
                    onChange={(e) => setForm({ ...form, safety_impact: e.target.value })}
                    className={inputClass}
                  >
                    {IMPACT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chantier */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Chantier
                </label>
                <input
                  value={form.chantier}
                  onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                  className={inputClass}
                  placeholder="Nom du chantier concerné"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Photos ({form.photos.length}/5)
                </label>

                {form.photos.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {form.photos.map((photo, i) => (
                      <div
                        key={i}
                        className="group relative flex h-9 items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--green-surface)] px-3 text-xs text-[var(--green)]"
                      >
                        <span className="max-w-[150px] truncate">
                          {photo.split("/").pop()}
                        </span>
                        <button
                          onClick={() => removePhoto(i)}
                          className="text-[var(--text-muted)] transition-colors hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.photos.length < 5 && (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-xs)] border border-dashed border-[var(--border-1)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--green)] hover:text-[var(--green)]">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Envoi en cours..." : "Ajouter des photos"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || uploading || aiLoading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--green)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
