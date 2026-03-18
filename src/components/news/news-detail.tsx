"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Clock,
  Heart,
  Share2,
  Send,
  Trash2,
  Pencil,
} from "lucide-react";
import DOMPurify from "dompurify";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import {
  addNewsComment,
  deleteNewsComment,
  toggleNewsLike,
  shareNews,
} from "@/actions/news";
import { NewsAttachmentsDisplay } from "./news-attachments";
import { CategoryBadge, PriorityBadge } from "@/components/ui/status-badge";
import type {
  NewsComment,
  NewsCategory,
  NewsAttachment,
} from "@/lib/types/database";

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
    author?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    } | null;
  };
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  userHasLiked: boolean;
  comments: NewsComment[];
  attachments: NewsAttachment[];
  currentUserId: string | null;
  canEdit: boolean;
}

export default function NewsDetail({
  article,
  viewsCount,
  likesCount: initialLikesCount,
  sharesCount: initialSharesCount,
  userHasLiked: initialHasLiked,
  comments: initialComments,
  attachments,
  currentUserId,
  canEdit,
}: NewsDetailProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialHasLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [sharesCount, setSharesCount] = useState(initialSharesCount);

  const authorName = article.author
    ? `${article.author.first_name} ${article.author.last_name}`
    : "Rédaction";

  function handleSubmitComment() {
    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await addNewsComment(article.id, newComment);
      if (result.success) {
        setNewComment("");
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

  function handleLike() {
    // Optimistic update
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    startTransition(async () => {
      const result = await toggleNewsLike(article.id);
      if (!result.success) {
        // Revert on failure
        setLiked(liked);
        setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
      }
    });
  }

  function handleShare() {
    startTransition(async () => {
      const result = await shareNews(article.id);
      if (result.success) {
        setSharesCount((prev) => prev + 1);
      }
    });
  }

  // Check if content contains HTML tags (from rich text editor)
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      {/* Back button & edit */}
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/actualites"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux actualités
        </Link>
        {canEdit && (
          <Link
            href={`/actualites/${article.id}/modifier`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Hero image */}
        {article.image_url && (
          <div className="relative -mx-7 mb-6 aspect-[16/7] overflow-hidden bg-[var(--hover)] md:mx-0 md:rounded-[var(--radius)]">
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

        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryBadge module="articles" category={article.category} />
            {article.priority !== "normal" && (
              <PriorityBadge priority={article.priority} />
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

          {/* Author & meta */}
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
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
          {isHtml ? (
            <div
              className="prose-news text-[13.5px] leading-relaxed text-[var(--text)]"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content),
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--text)]">
              {article.content || article.excerpt}
            </div>
          )}
        </div>

        {/* Social actions bar */}
        <div className="mb-6 flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-2.5 shadow-sm">
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-[12px] font-medium transition-colors",
              liked
                ? "bg-[var(--red-surface)] text-[var(--red)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--hover)]"
            )}
          >
            <Heart
              className={cn("h-4 w-4", liked && "fill-current")}
            />
            {likesCount > 0 && likesCount}
            <span className="hidden sm:inline">
              {liked ? "Aimé" : "J'aime"}
            </span>
          </button>

          <button
            onClick={handleShare}
            disabled={isPending || !currentUserId}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
          >
            <Share2 className="h-4 w-4" />
            {sharesCount > 0 && sharesCount}
            <span className="hidden sm:inline">Partager</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[var(--text-muted)]">
            <MessageSquare className="h-4 w-4" />
            {comments.length}
            <span className="hidden sm:inline">
              commentaire{comments.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-6">
            <NewsAttachmentsDisplay attachments={attachments} />
          </div>
        )}

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
                  className="flex-1 resize-none rounded-[var(--radius-sm)] border border-[var(--border-1)] px-3 py-2 text-[13px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
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
            <div className="py-8 text-center text-[13px] text-[var(--text-muted)]">
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
                    <p className="mt-1.5 pl-[38px] text-[13px] leading-relaxed text-[var(--text)]">
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
