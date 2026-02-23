"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Clock,
  Tag,
  Send,
  Trash2,
} from "lucide-react";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { addNewsComment, deleteNewsComment } from "@/actions/news";
import type { NewsComment, NewsCategory } from "@/lib/types/database";

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

interface NewsDetailProps {
  article: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    category: NewsCategory;
    priority: string;
    image_url: string;
    published_at: string | null;
    author?: { first_name: string; last_name: string; avatar_url?: string } | null;
  };
  viewsCount: number;
  comments: NewsComment[];
  currentUserId: string | null;
}

export default function NewsDetail({
  article,
  viewsCount,
  comments: initialComments,
  currentUserId,
}: NewsDetailProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const authorName = article.author
    ? `${article.author.first_name} ${article.author.last_name}`
    : "Rédaction";

  function handleSubmitComment() {
    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await addNewsComment(article.id, newComment);
      if (result.success) {
        setNewComment("");
        // Reload comments
        const { getNewsComments } = await import("@/actions/news");
        const updated = await getNewsComments(article.id);
        setComments(updated);
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    startTransition(async () => {
      await deleteNewsComment(commentId, article.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      {/* Back button */}
      <Link
        href="/actualites"
        className="mb-5 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux actualités
      </Link>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                categoryColors[article.category]
              )}
            >
              {categoryLabels[article.category]}
            </span>
            {article.priority !== "normal" && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white",
                  article.priority === "urgent"
                    ? "bg-red-500"
                    : "bg-[var(--yellow)]"
                )}
              >
                {article.priority === "urgent" ? "Urgent" : "Important"}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold leading-tight text-[var(--heading)]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mb-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--navy)] text-[8px] font-medium text-white">
                {authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span>Par {authorName}</span>
            </div>
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(article.published_at, "d MMMM yyyy 'à' HH:mm")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {viewsCount} vue{viewsCount > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {comments.length} commentaire{comments.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Image */}
        {article.image_url && (
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-[var(--radius)] bg-[var(--hover)]">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose-sm mb-8 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
          <div
            className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--text)]"
          >
            {article.content || article.excerpt}
          </div>
        </div>

        {/* Comments section */}
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          <div className="border-b border-[var(--border-1)] px-5 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
              <MessageSquare className="h-4 w-4" />
              Commentaires ({comments.length})
            </h3>
          </div>

          {/* Comment form */}
          {currentUserId && (
            <div className="border-b border-[var(--border-1)] px-5 py-4">
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  rows={2}
                  className="flex-1 resize-none rounded-[var(--radius-sm)] border border-[var(--border-1)] px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isPending || !newComment.trim()}
                  className="self-end rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-[var(--text-muted)]">
              Aucun commentaire. Soyez le premier à réagir !
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-1)]">
              {comments.map((comment) => {
                const commentAuthor = comment.author as unknown as {
                  first_name: string;
                  last_name: string;
                  avatar_url?: string;
                } | null;
                const commentAuthorName = commentAuthor
                  ? `${commentAuthor.first_name} ${commentAuthor.last_name}`
                  : "Anonyme";
                const isOwn = comment.author_id === currentUserId;

                return (
                  <div key={comment.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--navy)] text-[8px] font-medium text-white">
                          {commentAuthorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[12px] font-semibold text-[var(--heading)]">
                            {commentAuthorName}
                          </span>
                          <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                            {formatRelative(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded-[var(--radius-xs)] p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--red-surface)] hover:text-[var(--red)]"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 pl-[38px] text-[12.5px] leading-relaxed text-[var(--text)]">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
