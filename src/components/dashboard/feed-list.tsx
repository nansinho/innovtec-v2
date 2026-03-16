"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Newspaper,
  Send,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FeedPostWithMeta } from "@/actions/feed";
import type { FeedComment } from "@/lib/types/database";
import {
  toggleFeedLike,
  getFeedComments,
  addFeedComment,
  deleteFeedComment,
} from "@/actions/feed";

interface FeedListProps {
  initialPosts: FeedPostWithMeta[];
}

export default function FeedList({ initialPosts }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  function handleLikeUpdate(
    postId: string,
    liked: boolean,
    count: number
  ) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, user_has_liked: liked, likes_count: count }
          : p
      )
    );
  }

  function handleCommentCountChange(postId: string, delta: number) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: p.comments_count + delta }
          : p
      )
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          onLikeUpdate={handleLikeUpdate}
          onCommentCountChange={handleCommentCountChange}
        />
      ))}
    </div>
  );
}

// ==========================================
// Single Feed Post
// ==========================================

function FeedPost({
  post,
  onLikeUpdate,
  onCommentCountChange,
}: {
  post: FeedPostWithMeta;
  onLikeUpdate: (postId: string, liked: boolean, count: number) => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}) {
  const [liked, setLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const author = post.author;
  const authorName = author
    ? `${author.first_name} ${author.last_name}`.trim()
    : "Utilisateur";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr,
  });

  async function handleLike() {
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    setLiked(newLiked);
    setLikesCount(newCount);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);

    const result = await toggleFeedLike(post.id);
    setLiked(result.liked);
    setLikesCount(result.count);
    onLikeUpdate(post.id, result.liked, result.count);
  }

  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const data = await getFeedComments(post.id);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments((prev) => !prev);
  }

  async function handleSubmitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const result = await addFeedComment(post.id, commentText);
    if (result.success) {
      setCommentText("");
      // Refresh comments
      const data = await getFeedComments(post.id);
      setComments(data);
      onCommentCountChange(post.id, 1);
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteFeedComment(commentId);
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange(post.id, -1);
    }
  }

  return (
    <div className="border-b border-zinc-100 last:border-b-0">
      <div className="flex gap-3 px-5 py-4">
        {/* Avatar */}
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-[var(--yellow)]/20">
          {author?.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt=""
              fill
              sizes="36px"
              loading="lazy"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500">
              {authorName.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + time */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--heading)]">
              {authorName}
            </span>
            <span className="text-[11px] text-zinc-400">{timeAgo}</span>
          </div>

          {/* Content */}
          <p className="mt-1 text-sm leading-relaxed text-[var(--text)]">
            {post.content}
          </p>

          {/* Linked news */}
          {post.news && (
            <Link
              href={`/actualites/${post.news.id}`}
              className="mt-2.5 flex items-start gap-3 rounded-xl bg-zinc-50/80 p-3 shadow-xs ring-1 ring-zinc-950/[0.04] transition-all hover:bg-zinc-50 hover:shadow-sm"
            >
              {post.news.image_url ? (
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                  <Image
                    src={post.news.image_url}
                    alt=""
                    fill
                    sizes="64px"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-200">
                  <Newspaper className="h-4 w-4 text-zinc-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--heading)]">
                  {post.news.title}
                </p>
                {post.news.excerpt && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">
                    {post.news.excerpt}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Post image */}
          {!post.news && post.image_url && (
            <div className="relative mt-2.5 h-[150px] overflow-hidden rounded-xl">
              <Image
                src={post.image_url}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
          )}

          {/* Actions: Like + Comment */}
          <div className="mt-2.5 flex gap-1">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                liked
                  ? "bg-red-50 text-red-500"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              )}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  liked && "fill-red-500",
                  likeAnimating && "scale-125"
                )}
              />
              {likesCount > 0 && <span>{likesCount}</span>}
              {likesCount === 0 && <span>J&apos;aime</span>}
            </button>
            <button
              onClick={handleToggleComments}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                showComments
                  ? "bg-blue-50 text-blue-500"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.comments_count > 0 ? (
                <span>{post.comments_count}</span>
              ) : (
                <span>Commenter</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-zinc-50 bg-zinc-50/50 px-5 py-3">
          {loadingComments ? (
            <p className="py-2 text-center text-xs text-zinc-400">
              Chargement...
            </p>
          ) : (
            <>
              {/* Comments list */}
              {comments.length > 0 && (
                <div className="mb-3 flex flex-col gap-2.5">
                  {comments.map((comment) => {
                    const cAuthor = comment.author as {
                      first_name: string;
                      last_name: string;
                      avatar_url: string;
                    } | null;
                    const cName = cAuthor
                      ? `${cAuthor.first_name} ${cAuthor.last_name}`.trim()
                      : "Utilisateur";
                    const cTime = formatDistanceToNow(
                      new Date(comment.created_at),
                      { addSuffix: true, locale: fr }
                    );

                    return (
                      <div key={comment.id} className="group flex gap-2">
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                          {cAuthor?.avatar_url ? (
                            <Image
                              src={cAuthor.avatar_url}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-500">
                              {cName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="inline-block rounded-2xl bg-white px-3 py-1.5 shadow-xs ring-1 ring-black/[0.04]">
                            <span className="text-xs font-semibold text-[var(--heading)]">
                              {cName}
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text)]">
                              {comment.content}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 pl-1">
                            <span className="text-[10px] text-zinc-400">
                              {cTime}
                            </span>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="hidden text-[10px] text-zinc-400 hover:text-red-500 group-hover:inline-flex"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 rounded-full bg-white px-4 py-2 text-xs text-[var(--heading)] shadow-xs ring-1 ring-black/[0.06] outline-none placeholder:text-zinc-400 focus:ring-[var(--yellow)]"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--yellow)] text-white shadow-sm transition-all hover:bg-[var(--yellow-hover)] disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
