"use client";

import { useState, useTransition } from "react";
import {
  X,
  Send,
  Loader2,
  BookOpen,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createRex } from "@/actions/qse";
import { toast } from "sonner";
import AiGenerateButton from "@/components/ai/ai-generate-button";

interface RexFormProps {
  onCreated: () => void;
  onClose: () => void;
}

export default function RexForm({ onCreated, onClose }: RexFormProps) {
  const [mode, setMode] = useState<"ai" | "manual">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    description: "",
    lessons_learned: "",
    chantier: "",
  });

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

      const result = data.result;
      setForm({
        title: result.title || "",
        description: result.description || "",
        lessons_learned: result.lessons_learned || "",
        chantier: result.chantier || "",
      });
      setMode("manual");
      toast.success("REX généré par l'IA");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La description est obligatoire");
      return;
    }

    startTransition(async () => {
      const result = await createRex(form);
      if (result.success) {
        toast.success("Retour d'expérience enregistré");
        onCreated();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    });
  }

  const inputClass =
    "w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--card)] md:left-[var(--sidebar-width)]">
      <div className="relative flex h-full w-full flex-col bg-[var(--card)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--yellow)]" />
            <h2 className="text-lg font-semibold text-[var(--heading)]">
              Nouveau retour d&apos;exp&eacute;rience
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
              className="flex items-center gap-1.5 text-[12px] font-medium text-purple-600 transition-colors hover:text-purple-700"
            >
              {mode === "ai" ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {mode === "ai" ? "Mode IA actif" : "Mode manuel"}
            </button>
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
          {mode === "ai" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  D&eacute;crivez le contexte
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Lors du chantier de pose fibre à Lyon, nous avons rencontré un problème de coordination avec le sous-traitant qui a causé 2 jours de retard..."
                  rows={5}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
              <AiGenerateButton
                onClick={handleAiGenerate}
                loading={aiLoading}
                disabled={!aiPrompt.trim()}
                label="Générer le REX"
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Title + Chantier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Titre <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputClass}
                    placeholder="Titre du REX"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Chantier
                  </label>
                  <input
                    value={form.chantier}
                    onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                    className={inputClass}
                    placeholder="Nom du chantier"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Description <span className="text-[var(--red)]">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Contexte et déroulement de la situation..."
                />
              </div>

              {/* Leçons tirées */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Le&ccedil;ons tir&eacute;es
                </label>
                <textarea
                  value={form.lessons_learned}
                  onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })}
                  rows={4}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Points d'amélioration et leçons retenues..."
                />
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
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
