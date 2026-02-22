"use client";

import { useState, useTransition } from "react";
import { Send, ToggleLeft, ToggleRight } from "lucide-react";
import { createRex } from "@/actions/qse";
import AiGenerateButton from "@/components/ai/ai-generate-button";

interface RexFormProps {
  onCreated: () => void;
}

export default function RexForm({ onCreated }: RexFormProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    lessons_learned: "",
    chantier: "",
  });

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: "rex",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur IA");
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
    } catch {
      setError("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Le titre et la description sont obligatoires");
      return;
    }

    startTransition(async () => {
      const result = await createRex(form);
      if (result.success) {
        onCreated();
        setForm({ title: "", description: "", lessons_learned: "", chantier: "" });
        setAiPrompt("");
        setError("");
      } else {
        setError(result.error || "Erreur");
      }
    });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--heading)]">
          Nouveau retour d&apos;expérience
        </h3>
        <button
          onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
          className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 transition-colors hover:text-purple-700"
        >
          {mode === "ai" ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          {mode === "ai" ? "Mode IA actif" : "Mode manuel"}
        </button>
      </div>

      {mode === "ai" ? (
        <div className="space-y-3">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Décrivez le contexte du retour d'expérience... (ex: Lors du chantier de pose fibre à Lyon, nous avons rencontré un problème de coordination avec le sous-traitant qui a causé 2 jours de retard)"
            rows={3}
            className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple-400"
          />
          <AiGenerateButton
            onClick={handleAiGenerate}
            loading={aiLoading}
            disabled={!aiPrompt.trim()}
            label="Générer le REX"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Titre *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Titre du REX"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Chantier
              </label>
              <input
                value={form.chantier}
                onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Nom du chantier"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
              placeholder="Contexte et déroulement"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Leçons tirées
            </label>
            <textarea
              value={form.lessons_learned}
              onChange={(e) =>
                setForm({ ...form, lessons_learned: e.target.value })
              }
              rows={3}
              className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
              placeholder="Points d'amélioration et leçons retenues"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Envoi..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
}
