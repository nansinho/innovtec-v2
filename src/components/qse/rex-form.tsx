"use client";

import { useState, useTransition, useRef } from "react";
import {
  X,
  Send,
  Upload,
  Sparkles,
  PenLine,
  Plus,
  Loader2,
  Camera,
  BookOpen,
} from "lucide-react";
import { createRex, updateRex, uploadRexPhoto } from "@/actions/qse";
import type { Rex } from "@/lib/types/database";
import { toast } from "sonner";
import AiGenerateButton from "@/components/ai/ai-generate-button";
import FileUploadAi from "@/components/ai/file-upload-ai";
import {
  RexFaitsBadge,
  RexCausesBadge,
  RexActionsBadge,
  RexVigilanceBadge,
} from "@/components/icons/rex-section-icons";

type Mode = "import" | "ai" | "manual";

const EVENT_TYPES = [
  { value: "sd", label: "SD", full: "Situation Dangereuse", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "presquaccident", label: "PRESQU'ACCIDENT", full: "Presqu'accident", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "accident", label: "ACCIDENT", full: "Accident", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "hpe", label: "HPE", full: "High Potential Events", color: "text-purple-600 bg-purple-50 border-purple-200" },
];

const SECTIONS = [
  { key: "faits", label: "LES FAITS", photoKey: "faits_photo_url", bgClass: "border-l-[#1E3A5F] bg-blue-50/30", Badge: RexFaitsBadge },
  { key: "causes", label: "LES CAUSES ET LES CIRCONSTANCES", photoKey: "causes_photo_url", bgClass: "border-l-[#6B8E23] bg-green-50/30", Badge: RexCausesBadge },
  { key: "actions_engagees", label: "LA SYNTHÈSE DES ACTIONS ENGAGÉES", photoKey: "actions_photo_url", bgClass: "border-l-[#E67E22] bg-orange-50/30", Badge: RexActionsBadge },
  { key: "vigilance", label: "LE RAPPEL À VIGILANCE", photoKey: "vigilance_photo_url", bgClass: "border-l-[#F1C40F] bg-yellow-50/30", Badge: RexVigilanceBadge },
] as const;

interface RexFormData {
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  rex_number: string;
  rex_year: string;
  lieu: string;
  date_evenement: string;
  horaire: string;
  faits: string;
  faits_photo_url: string;
  causes: string;
  causes_photo_url: string;
  actions_engagees: string;
  actions_photo_url: string;
  vigilance: string;
  vigilance_photo_url: string;
  deja_arrive: string[];
  type_evenement: string;
  source_file_url: string;
}

const emptyForm: RexFormData = {
  title: "",
  description: "",
  lessons_learned: "",
  chantier: "",
  rex_number: "",
  rex_year: "",
  lieu: "",
  date_evenement: "",
  horaire: "",
  faits: "",
  faits_photo_url: "",
  causes: "",
  causes_photo_url: "",
  actions_engagees: "",
  actions_photo_url: "",
  vigilance: "",
  vigilance_photo_url: "",
  deja_arrive: [],
  type_evenement: "",
  source_file_url: "",
};

interface RexFormProps {
  onCreated: (id?: string) => void;
  onClose: () => void;
  initialData?: Rex;
}

function rexToFormData(rex: Rex): RexFormData {
  return {
    title: rex.title || "",
    description: rex.description || "",
    lessons_learned: rex.lessons_learned || "",
    chantier: rex.chantier || "",
    rex_number: rex.rex_number || "",
    rex_year: rex.rex_year ? String(rex.rex_year) : "",
    lieu: rex.lieu || "",
    date_evenement: rex.date_evenement || "",
    horaire: rex.horaire || "",
    faits: rex.faits || "",
    faits_photo_url: rex.faits_photo_url || "",
    causes: rex.causes || "",
    causes_photo_url: rex.causes_photo_url || "",
    actions_engagees: rex.actions_engagees || "",
    actions_photo_url: rex.actions_photo_url || "",
    vigilance: rex.vigilance || "",
    vigilance_photo_url: rex.vigilance_photo_url || "",
    deja_arrive: rex.deja_arrive || [],
    type_evenement: rex.type_evenement || "",
    source_file_url: rex.source_file_url || "",
  };
}

export default function RexForm({ onCreated, onClose, initialData }: RexFormProps) {
  const isEdit = !!initialData;
  const [mode, setMode] = useState<Mode>(isEdit ? "manual" : "import");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<RexFormData>(
    initialData ? rexToFormData(initialData) : emptyForm
  );
  const [dejaArriveInput, setDejaArriveInput] = useState("");
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const inputClass =
    "w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  function handleAiImportComplete(result: unknown, fileUrl?: string, extractedImages?: { section: string; url: string }[]) {
    const r = result as Record<string, unknown>;

    // Map extracted images to their sections
    const imageMap: Record<string, string> = {};
    if (extractedImages && Array.isArray(extractedImages)) {
      for (const img of extractedImages) {
        if (img.section === "faits") imageMap.faits_photo_url = img.url;
        else if (img.section === "causes") imageMap.causes_photo_url = img.url;
        else if (img.section === "actions_engagees") imageMap.actions_photo_url = img.url;
        else if (img.section === "vigilance") imageMap.vigilance_photo_url = img.url;
      }
    }

    setForm({
      title: (r.title as string) || "",
      description: (r.description as string) || "",
      lessons_learned: (r.lessons_learned as string) || "",
      chantier: (r.chantier as string) || "",
      rex_number: String(r.rex_number || ""),
      rex_year: String(r.rex_year || ""),
      lieu: (r.lieu as string) || "",
      date_evenement: (r.date_evenement as string) || "",
      horaire: (r.horaire as string) || "",
      faits: (r.faits as string) || "",
      faits_photo_url: imageMap.faits_photo_url || "",
      causes: (r.causes as string) || "",
      causes_photo_url: imageMap.causes_photo_url || "",
      actions_engagees: (r.actions_engagees as string) || "",
      actions_photo_url: imageMap.actions_photo_url || "",
      vigilance: (r.vigilance as string) || "",
      vigilance_photo_url: imageMap.vigilance_photo_url || "",
      deja_arrive: Array.isArray(r.deja_arrive) ? (r.deja_arrive as string[]) : [],
      type_evenement: (r.type_evenement as string) || "",
      source_file_url: fileUrl || "",
    });
    setMode("manual");

    const imgCount = extractedImages?.length || 0;
    const imgMsg = imgCount > 0 ? ` — ${imgCount} image(s) extraite(s) du PDF` : "";
    toast.success(`Fiche REX analysée par l'IA${imgMsg} — vérifiez et complétez les champs`);
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "rex" }),
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
        description: r.description || "",
        lessons_learned: r.lessons_learned || "",
        chantier: r.chantier || "",
        faits: r.faits || r.description || "",
        causes: r.causes || "",
        actions_engagees: r.actions_engagees || r.actions || "",
        vigilance: r.vigilance || "",
      }));
      setMode("manual");
      toast.success("REX généré par l'IA");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhotoUpload(sectionKey: string, file: File) {
    setUploadingSection(sectionKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("section", sectionKey);
      const result = await uploadRexPhoto(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        const actualKey = sectionKey === "actions_engagees" ? "actions_photo_url" : `${sectionKey}_photo_url`;
        setForm((prev) => ({ ...prev, [actualKey]: result.url }));
        toast.success("Photo uploadée");
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingSection(null);
    }
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!form.faits.trim() && !form.description.trim()) {
      toast.error("La description ou les faits sont obligatoires");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...form,
        description: form.description || form.faits,
        rex_year: form.rex_year ? parseInt(form.rex_year) : null,
        date_evenement: form.date_evenement || null,
      };

      if (isEdit && initialData) {
        const result = await updateRex(initialData.id, payload);
        if (result.success) {
          toast.success("Fiche REX mise à jour");
          onCreated(initialData.id);
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour");
        }
      } else {
        const result = await createRex(payload);
        if (result.success) {
          toast.success("Fiche REX enregistrée");
          onCreated(result.id);
        } else {
          toast.error(result.error || "Erreur lors de l'enregistrement");
        }
      }
    });
  }

  function addDejaArrive() {
    if (!dejaArriveInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      deja_arrive: [...prev.deja_arrive, dejaArriveInput.trim()],
    }));
    setDejaArriveInput("");
  }

  function removeDejaArrive(index: number) {
    setForm((prev) => ({
      ...prev,
      deja_arrive: prev.deja_arrive.filter((_, i) => i !== index),
    }));
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
            <BookOpen className="h-5 w-5 text-[var(--yellow)]" />
            <h2 className="text-lg font-semibold text-[var(--heading)]">
              {isEdit ? "Modifier la fiche REX" : "Nouvelle fiche REX"}
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
                      ? "bg-[var(--navy)] text-white"
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
                Importez une fiche REX existante (PDF ou image) et l&apos;IA extraira automatiquement toutes les informations.
              </p>
              <FileUploadAi
                onAnalysisComplete={handleAiImportComplete}
                type="rex"
                label="Importer une fiche REX"
              />
            </div>
          )}

          {/* Mode: AI Generate */}
          {mode === "ai" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Décrivez le contexte de l&apos;événement
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Lors du chantier de pose fibre à Lyon, un camion a accroché un câble télécom aérien en passant par une rue étroite..."
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <AiGenerateButton
                onClick={handleAiGenerate}
                loading={aiLoading}
                disabled={!aiPrompt.trim()}
                label="Générer la fiche REX"
              />
            </div>
          )}

          {/* Mode: Manual (also shown after AI import/generate) */}
          {mode === "manual" && (
            <div className="space-y-6">
              {/* Header fields */}
              <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-4">
                <h3 className="mb-3 text-[12px] font-semibold text-[var(--text-muted)]">
                  Informations générales
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      N° Fiche
                    </label>
                    <input
                      value={form.rex_number}
                      onChange={(e) => setForm({ ...form, rex_number: e.target.value })}
                      className={inputClass}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      Année
                    </label>
                    <input
                      type="number"
                      value={form.rex_year}
                      onChange={(e) => setForm({ ...form, rex_year: e.target.value })}
                      className={inputClass}
                      placeholder="2025"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date_evenement}
                      onChange={(e) => setForm({ ...form, date_evenement: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      Horaire
                    </label>
                    <input
                      value={form.horaire}
                      onChange={(e) => setForm({ ...form, horaire: e.target.value })}
                      className={inputClass}
                      placeholder="10h40"
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      Titre de l&apos;événement *
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className={inputClass}
                      placeholder="Accrochage d'un réseau télécom aérien par un camion"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                      Lieu
                    </label>
                    <input
                      value={form.lieu}
                      onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                      className={inputClass}
                      placeholder="Croisement rue Cadeneaux / rue Fenouil"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                    Chantier
                  </label>
                  <input
                    value={form.chantier}
                    onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                    className={inputClass}
                    placeholder="DC25-068944"
                  />
                </div>
              </div>

              {/* 4 Sections */}
              {SECTIONS.map(({ key, label, photoKey, bgClass, Badge }) => {
                const textValue = form[key as keyof RexFormData] as string;
                const actualPhotoKey = key === "actions_engagees" ? "actions_photo_url" : photoKey;
                const photoValue = form[actualPhotoKey as keyof RexFormData] as string;

                return (
                  <div
                    key={key}
                    className={`rounded-[var(--radius)] border-l-4 p-4 ${bgClass}`}
                  >
                    <div className="mb-3">
                      <Badge />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <textarea
                          value={textValue}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                          rows={4}
                          className={`${inputClass} resize-none`}
                          placeholder={`Contenu de la section "${label}"...`}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-[var(--radius-xs)] border border-dashed border-[var(--border-1)] bg-white p-2">
                        {photoValue ? (
                          <div className="relative w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoValue}
                              alt={`Photo ${label}`}
                              className="h-24 w-full rounded object-cover"
                            />
                            <button
                              onClick={() =>
                                setForm({ ...form, [actualPhotoKey]: "" })
                              }
                              className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => photoInputRefs.current[key]?.click()}
                            disabled={uploadingSection === key}
                            className="flex flex-col items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                          >
                            {uploadingSection === key ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Camera className="h-6 w-6" />
                            )}
                            <span className="text-[10px]">Ajouter une photo</span>
                          </button>
                        )}
                        <input
                          ref={(el) => { photoInputRefs.current[key] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoUpload(key, f);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Footer: Déjà arrivé + Type d'événement */}
              <div className="grid grid-cols-2 gap-4">
                {/* Déjà arrivé */}
                <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-4">
                  <h3 className="mb-2 text-[12px] font-semibold text-blue-600">
                    Déjà arrivé ?
                  </h3>
                  <div className="space-y-2">
                    {form.deja_arrive.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
                        <span className="flex-1 text-sm text-[var(--heading)]">{item}</span>
                        <button
                          onClick={() => removeDejaArrive(i)}
                          className="rounded p-0.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-1.5">
                      <input
                        value={dejaArriveInput}
                        onChange={(e) => setDejaArriveInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDejaArrive())}
                        className="flex-1 rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-1.5 text-sm outline-none focus:border-[var(--yellow)]"
                        placeholder="Ajouter un précédent..."
                      />
                      <button
                        onClick={addDejaArrive}
                        className="rounded-[var(--radius-xs)] bg-[var(--navy)] p-1.5 text-white hover:bg-[var(--navy)]/90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Type d'événement */}
                <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-4">
                  <h3 className="mb-2 text-[12px] font-semibold text-orange-600">
                    Type d&apos;événement
                  </h3>
                  <div className="space-y-1.5">
                    {EVENT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() =>
                          setForm({
                            ...form,
                            type_evenement:
                              form.type_evenement === t.value ? "" : t.value,
                          })
                        }
                        className={`w-full rounded-[var(--radius-xs)] border px-3 py-2 text-left text-sm font-medium transition-all ${
                          form.type_evenement === t.value
                            ? t.color + " ring-1 ring-current"
                            : "border-transparent bg-white text-[var(--text-secondary)] hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-semibold">{t.label}</span>
                        <span className="ml-1.5 text-[11px] font-normal opacity-70">
                          ({t.full})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
            disabled={isPending || aiLoading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-5 py-2 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending
              ? "Enregistrement..."
              : isEdit
                ? "Mettre à jour"
                : "Enregistrer la fiche REX"}
          </button>
        </div>
      </div>
    </div>
  );
}
