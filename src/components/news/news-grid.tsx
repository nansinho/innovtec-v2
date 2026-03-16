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
      {/* Filters — pill tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            selectedCategory === "all"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {categoryLabels[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">Aucune actualité</p>
          <p className="mt-1 text-sm text-gray-500">
            Les actualités apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Table header */}
          <div className="hidden border-b border-gray-200 bg-gray-50/50 px-6 py-3 md:grid md:grid-cols-[1fr_100px_100px_80px_120px_24px] md:items-center md:gap-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Article
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Catégorie
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Auteur
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </span>
            <span className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Engagement
            </span>
            <span />
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {filtered.map((article) => {
              const authorName = article.author
                ? `${article.author.first_name} ${article.author.last_name}`
                : "Rédaction";

              return (
                <div
                  key={article.id}
                  onClick={() => router.push(`/actualites/${article.id}`)}
                  className="group cursor-pointer px-6 py-3.5 transition-colors hover:bg-gray-50/50 md:grid md:grid-cols-[1fr_100px_100px_80px_120px_24px] md:items-center md:gap-4"
                >
                  {/* Article info */}
                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail */}
                    <div className="relative hidden h-12 w-18 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
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
                          <Tag className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {/* Priority dot instead of badge */}
                        {article.priority !== "normal" && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        )}
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {article.title}
                        </h3>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {article.excerpt}
                      </p>

                      {/* Mobile meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 md:hidden">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {categoryLabels[article.category]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {authorName}
                        </span>
                        {article.published_at && (
                          <span className="text-xs text-gray-400">
                            {formatRelative(article.published_at)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Eye className="h-3 w-3" />
                          {article.views_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category - desktop */}
                  <div className="hidden md:block">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {categoryLabels[article.category]}
                    </span>
                  </div>

                  {/* Author - desktop */}
                  <div className="hidden md:block">
                    <span className="text-xs text-gray-500">
                      {authorName}
                    </span>
                  </div>

                  {/* Date - desktop */}
                  <div className="hidden md:block">
                    {article.published_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatRelative(article.published_at)}
                      </span>
                    )}
                  </div>

                  {/* Engagement - desktop */}
                  <div className="hidden md:flex md:items-center md:justify-center md:gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-400" title="Vues">
                      <Eye className="h-3 w-3" />
                      {article.views_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400" title="Likes">
                      <Heart className="h-3 w-3" />
                      {article.likes_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400" title="Commentaires">
                      <MessageSquare className="h-3 w-3" />
                      {article.comments_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400" title="Partages">
                      <Share2 className="h-3 w-3" />
                      {article.shares_count ?? 0}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:block">
                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
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
