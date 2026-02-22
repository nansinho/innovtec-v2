"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  X,
  Sparkles,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  createNews,
  togglePublishNews,
  deleteNews,
} from "@/actions/news";
import type { News, NewsCategory, NewsPriority } from "@/lib/types/database";

const categoryLabels: Record<NewsCategory, string> = {
  entreprise: "Entreprise",
  securite: "Sécurité",
  formation: "Formation",
  chantier: "Chantier",
  social: "Social",
  rh: "RH",
};

const categoryColors: Record<NewsCategory, string> = {
  entreprise: "bg-blue-50 text-blue-700",
  securite: "bg-red-50 text-red-700",
  formation: "bg-green-50 text-green-700",
  chantier: "bg-orange-50 text-orange-700",
  social: "bg-purple-50 text-purple-700",
  rh: "bg-indigo-50 text-indigo-700",
};

type NewsItem = News & {
  author?: { first_name: string; last_name: string } | null;
};

interface AdminNewsManagerProps {
  news: NewsItem[];
}

export default function AdminNewsManager({ news: initialNews }: AdminNewsManagerProps) {
  const [news, setNews] = useState(initialNews);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);

  // AI state
  const [formMode, setFormMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "entreprise" as NewsCategory,
    priority: "normal" as NewsPriority,
    image_url: "",
    is_carousel: false,
    is_published: false,
  });

  const filtered = news.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit() {
    if (!form.title.trim()) return;

    startTransition(async () => {
      const result = await createNews(form);
      if (result.success) {
        setShowForm(false);
        setForm({
          title: "",
          excerpt: "",
          content: "",
          category: "entreprise",
          priority: "normal",
          image_url: "",
          is_carousel: false,
          is_published: false,
        });
        // Refresh the list
        window.location.reload();
      }
    });
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "news" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Erreur IA");
        return;
      }

      const result = data.result;
      setForm({
        ...form,
        title: result.title || "",
        excerpt: result.excerpt || "",
        content: result.content || "",
        category: result.category || "entreprise",
        priority: result.priority || "normal",
      });
      setFormMode("manual");
    } catch {
      setAiError("Erreur de connexion au serveur");
    } finally {
      setAiLoading(false);
    }
  }

  function handleTogglePublish(newsId: string, publish: boolean) {
    setLoading(newsId);
    startTransition(async () => {
      await togglePublishNews(newsId, publish);
      setNews((prev) =>
        prev.map((n) =>
          n.id === newsId
            ? {
                ...n,
                is_published: publish,
                published_at: publish ? new Date().toISOString() : null,
              }
            : n
        )
      );
      setLoading(null);
    });
  }

  function handleDelete(newsId: string) {
    if (!confirm("Supprimer cette actualité définitivement ?")) return;
    setLoading(newsId);
    startTransition(async () => {
      await deleteNews(newsId);
      setNews((prev) => prev.filter((n) => n.id !== newsId));
      setLoading(null);
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Rechercher une actualité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] py-2.5 pl-10 pr-4 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Annuler" : "Nouvelle actualité"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--heading)]">
              Créer une actualité
            </h3>
            <button
              onClick={() => setFormMode(formMode === "ai" ? "manual" : "ai")}
              className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 transition-colors hover:text-purple-700"
            >
              {formMode === "ai" ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {formMode === "ai" ? "Mode IA actif" : "Mode manuel"}
            </button>
          </div>

          {/* AI Mode */}
          {formMode === "ai" && (
            <div className="mb-4 space-y-3 rounded-[var(--radius-sm)] border border-purple-200 bg-purple-50/30 p-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Décrivez le sujet de l&apos;actualité et l&apos;IA générera le titre, l&apos;extrait, le contenu et suggérera la catégorie.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Nous avons remporté le marché de fibre optique de la ville de Nantes. Le chantier débutera en mars 2026 et durera 8 mois..."
                rows={3}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-purple-200 bg-white px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple-400"
              />
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiLoading ? "Génération..." : "Générer l'actualité"}
              </button>
              {aiError && (
                <p className="text-[12px] text-red-500">{aiError}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Titre *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Titre de l'actualité"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Extrait
              </label>
              <input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Court résumé"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Contenu
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Contenu détaillé de l'actualité"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as NewsCategory })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-2 text-sm outline-none focus:border-[var(--yellow)]"
                >
                  {(Object.entries(categoryLabels) as [NewsCategory, string][]).map(
                    ([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                  Priorité
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as NewsPriority,
                    })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-2 text-sm outline-none focus:border-[var(--yellow)]"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                  URL de l&apos;image
                </label>
                <input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.is_carousel}
                  onChange={(e) =>
                    setForm({ ...form, is_carousel: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[var(--yellow)]"
                />
                Afficher dans le carousel
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[var(--yellow)]"
                />
                Publier immédiatement
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim()}
                className="rounded-[var(--radius-sm)] bg-[var(--yellow)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
              >
                {isPending ? "Création..." : "Créer l'actualité"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News table */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border-1)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-1)] bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Titre
              </th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Catégorie
              </th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Statut
              </th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)] bg-white">
            {filtered.map((article) => {
              const authorName = article.author
                ? `${article.author.first_name} ${article.author.last_name}`
                : "—";

              return (
                <tr
                  key={article.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-[var(--heading)]">
                        {article.title}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Par {authorName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        categoryColors[article.category]
                      )}
                    >
                      {categoryLabels[article.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        article.is_published
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {article.is_published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {article.published_at
                      ? formatDate(article.published_at)
                      : formatDate(article.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleTogglePublish(
                            article.id,
                            !article.is_published
                          )
                        }
                        disabled={loading === article.id}
                        className={cn(
                          "rounded p-1.5 transition-colors",
                          article.is_published
                            ? "text-green-500 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        )}
                        title={
                          article.is_published ? "Dépublier" : "Publier"
                        }
                      >
                        {article.is_published ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={loading === article.id}
                        className="rounded p-1.5 text-red-400 transition-colors hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Aucune actualité trouvée.
          </div>
        )}
      </div>
    </div>
  );
}
