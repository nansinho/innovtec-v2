"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createDangerReport } from "@/actions/qse";
import AiGenerateButton from "@/components/ai/ai-generate-button";

interface DangerFormProps {
  onCreated: () => void;
}

export default function DangerForm({ onCreated }: DangerFormProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    severity: 3,
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
          type: "danger",
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
        location: result.location || "",
        severity: result.severity || 3,
      });
      setMode("manual"); // Switch to manual to review
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
      const result = await createDangerReport(form);
      if (result.success) {
        onCreated();
        setForm({ title: "", description: "", location: "", severity: 3 });
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
          Nouveau signalement
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
            placeholder="Décrivez brièvement la situation dangereuse... (ex: câble électrique dénudé à proximité du passage piéton sur le chantier de Bordeaux)"
            rows={3}
            className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple-400"
          />
          <AiGenerateButton
            onClick={handleAiGenerate}
            loading={aiLoading}
            disabled={!aiPrompt.trim()}
            label="Générer le signalement"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Titre *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
              placeholder="Titre du signalement"
            />
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
              placeholder="Description détaillée de la situation"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Localisation
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Lieu / chantier"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Sévérité (1-5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, severity: n })}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-[var(--radius-xs)] border text-sm font-bold transition-colors",
                      form.severity === n
                        ? n >= 4
                          ? "border-red-400 bg-red-50 text-red-700"
                          : n >= 3
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-green-400 bg-green-50 text-green-700"
                        : "border-[var(--border-1)] text-[var(--text-muted)] hover:bg-gray-50"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Envoi..." : "Signaler"}
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
