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
import { cn, formatDate, formatRelative } from "@/lib/utils";
import {
  addNewsComment,
  deleteNewsComment,
  toggleNewsLike,
  shareNews,
} from "@/actions/news";
import { NewsAttachmentsDisplay } from "./news-attachments";
import type {
  NewsComment,
  NewsCategory,
  NewsAttachment,
} from "@/lib/types/database";

const categoryLabels: Record<NewsCategory, string> = {
  entreprise: "Entreprise",
  securite: "Sécurité",
  formation: "Formation",
  chantier: "Chantier",
  social: "Social",
  rh: "RH",
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
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    startTransition(async () => {
      const result = await toggleNewsLike(article.id);
      if (!result.success) {
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

  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);

  return (
    <div className="px-8 py-6 pb-20 md:pb-6">
      {/* Back button & edit */}
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/actualites"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux actualités
        </Link>
        {canEdit && (
          <Link
            href={`/actualites/${article.id}/modifier`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Hero image */}
        {article.image_url && (
          <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-xl bg-gray-100">
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
            {/* Category badge — always gray */}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {categoryLabels[article.category]}
            </span>
            {/* Priority badge — semantic color */}
            {article.priority !== "normal" && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  article.priority === "urgent"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {article.priority === "urgent" ? "Urgent" : "Important"}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mb-4 text-sm leading-relaxed text-gray-500">
              {article.excerpt}
            </p>
          )}

          {/* Author & meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[8px] font-medium text-gray-600">
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

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6 pt-6">
          {/* Content — directly on white, no card wrapper */}
          {isHtml ? (
            <div
              className="prose-news text-sm leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{
                __html: article.content,
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {article.content || article.excerpt}
            </div>
          )}
        </div>

        {/* Social actions bar */}
        <div className="mb-6 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                liked
                  ? "bg-red-50 text-red-600"
                  : "text-gray-600 hover:bg-gray-100"
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
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4" />
              {sharesCount > 0 && sharesCount}
              <span className="hidden sm:inline">Partager</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4" />
              {comments.length}
              <span className="hidden sm:inline">
                commentaire{comments.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-6">
            <NewsAttachmentsDisplay attachments={attachments} />
          </div>
        )}

        {/* Comments section */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MessageSquare className="h-4 w-4" />
              Commentaires ({comments.length})
            </h3>
          </div>

          {/* Comment form */}
          {currentUserId && (
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isPending || !newComment.trim()}
                  className="self-end rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Aucun commentaire. Soyez le premier à réagir !
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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
                  <div key={comment.id} className="px-6 py-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[8px] font-medium text-gray-600">
                          {commentAuthorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {commentAuthorName}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            {formatRelative(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 pl-[38px] text-sm leading-relaxed text-gray-700">
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
