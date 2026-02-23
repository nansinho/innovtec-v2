"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  MessageSquare,
  Clock,
  Tag,
  AlertCircle,
  Filter,
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
  entreprise: "bg-[var(--blue-surface)] text-[var(--blue)]",
  securite: "bg-[var(--red-surface)] text-[var(--red)]",
  formation: "bg-[var(--green-surface)] text-[var(--green)]",
  chantier: "bg-orange-50 text-orange-700",
  social: "bg-[var(--purple-surface)] text-[var(--purple)]",
  rh: "bg-indigo-50 text-indigo-700",
};

const priorityConfig: Record<NewsPriority, { label: string; className: string }> = {
  normal: { label: "", className: "" },
  important: {
    label: "Important",
    className: "border-l-4 border-l-[var(--yellow)]",
  },
  urgent: {
    label: "Urgent",
    className: "border-l-4 border-l-[var(--red)]",
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
  author?: { first_name: string; last_name: string; avatar_url?: string } | null;
}

interface NewsGridProps {
  news: NewsItem[];
}

export default function NewsGrid({ news }: NewsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    NewsCategory | "all"
  >("all");

  const filtered =
    selectedCategory === "all"
      ? news
      : news.filter((n) => n.category === selectedCategory);

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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune actualité pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => {
            const priority = priorityConfig[article.priority];
            const authorName = article.author
              ? `${article.author.first_name} ${article.author.last_name}`
              : "Rédaction";

            return (
              <Link
                key={article.id}
                href={`/actualites/${article.id}`}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                  priority.className
                )}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-[var(--hover)]">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Tag className="h-8 w-8 text-[var(--border-1)]" />
                    </div>
                  )}

                  {/* Priority badge */}
                  {article.priority !== "normal" && (
                    <div
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white",
                        article.priority === "urgent"
                          ? "bg-red-500"
                          : "bg-[var(--yellow)]"
                      )}
                    >
                      {priority.label}
                    </div>
                  )}

                  {/* Category */}
                  <div className="absolute right-3 top-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        categoryColors[article.category]
                      )}
                    >
                      {categoryLabels[article.category]}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1.5 text-[13.5px] font-semibold leading-snug text-[var(--heading)] line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="mb-3 flex-1 text-[12px] leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between border-t border-[var(--border-1)] pt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--navy)] text-[7px] font-medium text-white">
                        {authorName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="text-[10.5px] text-[var(--text-muted)]">
                        {authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
                        <Eye className="h-3 w-3" />
                        {article.views_count}
                      </span>
                      <span className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
                        <MessageSquare className="h-3 w-3" />
                        {article.comments_count}
                      </span>
                      {article.published_at && (
                        <span className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          {formatRelative(article.published_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
