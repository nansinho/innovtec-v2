"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Clock,
  Tag,
  AlertCircle,
  Filter,
  ChevronRight,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import type { NewsCategory, NewsPriority } from "@/lib/types/database";

const categoryLabels: Record<NewsCategory, string> = {
  entreprise: "Entreprise",
  securite: "Sécurité",
  formation: "Formation",
  chantier: "Chantier",
  social: "Social",
  rh: "RH",
};

const categoryColors: Record<NewsCategory, string> = {
  entreprise: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm",
  securite: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm",
  formation: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm",
  chantier: "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-sm",
  social: "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-sm",
  rh: "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm",
};

const priorityConfig: Record<
  NewsPriority,
  { label: string; className: string; dot: string }
> = {
  normal: { label: "", className: "", dot: "" },
  important: {
    label: "Important",
    className: "bg-[var(--yellow-surface)] text-[var(--yellow)]",
    dot: "bg-[var(--yellow)]",
  },
  urgent: {
    label: "Urgent",
    className: "bg-[var(--red-surface)] text-[var(--red)]",
    dot: "bg-[var(--red)]",
  },
};

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  priority: NewsPriority;
  image_url: string;
  published_at: string | null;
  views_count: number;
  comments_count: number;
  likes_count?: number;
  shares_count?: number;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
}

interface NewsTableProps {
  news: NewsItem[];
}

export default function NewsTable({ news }: NewsTableProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    NewsCategory | "all"
  >("all");

  const filtered = useMemo(
    () =>
      selectedCategory === "all"
        ? news
        : news.filter((n) => n.category === selectedCategory),
    [news, selectedCategory]
  );

  const categories = Object.keys(categoryLabels) as NewsCategory[];

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--text-muted)]" />
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
            selectedCategory === "all"
              ? "bg-[var(--navy)] text-white"
              : "bg-[var(--hover)] text-[var(--text-secondary)] hover:bg-[var(--border-1)]"
          )}
        >
          Toutes ({news.length})
        </button>
        {categories.map((cat) => {
          const count = news.filter((n) => n.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-[var(--navy)] text-white"
                  : "bg-[var(--hover)] text-[var(--text-secondary)] hover:bg-[var(--border-1)]"
              )}
            >
              {categoryLabels[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune actualité pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          {/* Table header */}
          <div className="hidden border-b border-[var(--border-1)] bg-[var(--hover)] px-5 py-3 md:grid md:grid-cols-[1fr_100px_100px_80px_120px_24px] md:items-center md:gap-4">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Article
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Catégorie
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Auteur
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Date
            </span>
            <span className="text-center text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Engagement
            </span>
            <span />
          </div>

          {/* Table rows */}
          <div className="divide-y divide-[var(--border-1)]">
            {filtered.map((article) => {
              const priority = priorityConfig[article.priority];
              const authorName = article.author
                ? `${article.author.first_name} ${article.author.last_name}`
                : "Rédaction";

              return (
                <div
                  key={article.id}
                  onClick={() => router.push(`/actualites/${article.id}`)}
                  className="group cursor-pointer px-5 py-4 transition-colors hover:bg-[var(--hover)] md:grid md:grid-cols-[1fr_100px_100px_80px_120px_24px] md:items-center md:gap-4"
                >
                  {/* Article info */}
                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail */}
                    <div className="relative hidden h-12 w-18 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-[var(--hover)] sm:block">
                      {article.image_url ? (
                        <Image
                          src={article.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Tag className="h-4 w-4 text-[var(--border-1)]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {article.priority !== "normal" && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                              priority.className
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                priority.dot
                              )}
                            />
                            {priority.label}
                          </span>
                        )}
                        <h3 className="truncate text-[13px] font-semibold text-[var(--heading)] group-hover:text-[var(--yellow)]">
                          {article.title}
                        </h3>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-secondary)]">
                        {article.excerpt}
                      </p>

                      {/* Mobile meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 md:hidden">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-medium",
                            categoryColors[article.category]
                          )}
                        >
                          {categoryLabels[article.category]}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {authorName}
                        </span>
                        {article.published_at && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatRelative(article.published_at)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Eye className="h-3 w-3" />
                          {article.views_count}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Heart className="h-3 w-3" />
                          {article.likes_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category - desktop */}
                  <div className="hidden md:block">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        categoryColors[article.category]
                      )}
                    >
                      {categoryLabels[article.category]}
                    </span>
                  </div>

                  {/* Author - desktop */}
                  <div className="hidden md:block">
                    <span className="text-[11.5px] text-[var(--text-secondary)]">
                      {authorName}
                    </span>
                  </div>

                  {/* Date - desktop */}
                  <div className="hidden md:block">
                    {article.published_at && (
                      <span className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
                        <Clock className="h-3 w-3" />
                        {formatRelative(article.published_at)}
                      </span>
                    )}
                  </div>

                  {/* Engagement - desktop */}
                  <div className="hidden md:flex md:items-center md:justify-center md:gap-3">
                    <span
                      className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]"
                      title="Vues"
                    >
                      <Eye className="h-3 w-3" />
                      {article.views_count}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]"
                      title="Likes"
                    >
                      <Heart className="h-3 w-3" />
                      {article.likes_count ?? 0}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]"
                      title="Commentaires"
                    >
                      <MessageSquare className="h-3 w-3" />
                      {article.comments_count}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]"
                      title="Partages"
                    >
                      <Share2 className="h-3 w-3" />
                      {article.shares_count ?? 0}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:block">
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--yellow)]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
