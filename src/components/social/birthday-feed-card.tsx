"use client";

import { useState, useTransition, useEffect } from "react";
import { Heart, MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";
import Image from "next/image";
import { sendBirthdayWish, getBirthdayWishesFor, updateBirthdayWish, deleteBirthdayWish } from "@/actions/birthday";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Profile, BirthdayWish } from "@/lib/types/database";

interface BirthdayFeedCardProps {
  person: Profile;
  currentUserId: string;
  initialWishes: BirthdayWish[];
}

export default function BirthdayFeedCard({
  person,
  currentUserId,
  initialWishes,
}: BirthdayFeedCardProps) {
  const [wishes, setWishes] = useState(initialWishes);
  const [liked, setLiked] = useState(
    initialWishes.some((w) => w.from_user_id === currentUserId)
  );
  const [showComments, setShowComments] = useState(false);
  const [wishMessage, setWishMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Edit state
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    setWishes(initialWishes);
    setLiked(initialWishes.some((w) => w.from_user_id === currentUserId));
  }, [initialWishes, currentUserId]);

  const isMe = person.id === currentUserId;
  const name = `${person.first_name} ${person.last_name}`.trim();
  const initials =
    `${person.first_name?.[0] ?? ""}${person.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const hasReplied = isMe && wishes.some((w) => w.from_user_id === currentUserId);

  function handleSendWish() {
    if (!wishMessage.trim()) return;
    if (isMe && hasReplied) return;
    setError("");
    startTransition(async () => {
      const result = await sendBirthdayWish(
        person.id,
        wishMessage.trim()
      );
      if (result.success) {
        if (!isMe) setLiked(true);
        setWishMessage("");
        const updated = await getBirthdayWishesFor(person.id);
        setWishes(updated);
      } else {
        setError(result.error ?? "Erreur");
      }
    });
  }

  function handleLike() {
    if (isMe || liked) {
      setShowComments(!showComments);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await sendBirthdayWish(person.id, "Joyeux anniversaire ! 🎂");
      if (result.success) {
        setLiked(true);
        const updated = await getBirthdayWishesFor(person.id);
        setWishes(updated);
      } else {
        if (result.error === "Vous avez déjà envoyé vos vœux") {
          setLiked(true);
        } else {
          setError(result.error ?? "Erreur");
        }
      }
    });
  }

  function startEditWish(wish: BirthdayWish) {
    setEditingWishId(wish.id);
    setEditMessage(wish.message);
  }

  function cancelEditWish() {
    setEditingWishId(null);
    setEditMessage("");
  }

  async function saveEditWish() {
    if (!editingWishId || !editMessage.trim() || editSaving) return;
    setEditSaving(true);
    const result = await updateBirthdayWish(editingWishId, editMessage.trim());
    if (result.success) {
      setWishes((prev) =>
        prev.map((w) =>
          w.id === editingWishId ? { ...w, message: editMessage.trim() } : w
        )
      );
      setEditingWishId(null);
      setEditMessage("");
    }
    setEditSaving(false);
  }

  async function handleDeleteWish(wishId: string) {
    const result = await deleteBirthdayWish(wishId);
    if (result.success) {
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      // If the user deleted their own wish, they can send another
      const remaining = wishes.filter((w) => w.id !== wishId);
      if (!remaining.some((w) => w.from_user_id === currentUserId)) {
        setLiked(false);
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs">
      {/* Birthday header */}
      <div className="relative bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 px-5 py-6 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[10%] top-2 text-2xl">🎈</div>
          <div className="absolute right-[15%] top-4 text-xl">🎉</div>
          <div className="absolute left-[25%] bottom-2 text-lg">✨</div>
          <div className="absolute right-[10%] bottom-3 text-2xl">🎊</div>
          <div className="absolute left-[50%] top-1 text-lg">🎁</div>
        </div>
        <div className="relative">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-white shadow-lg">
            {person.avatar_url ? (
              <Image
                src={person.avatar_url}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-pink-100 text-lg font-bold text-pink-600">
                {initials}
              </div>
            )}
          </div>
          <p className="text-lg font-bold text-white drop-shadow-sm">
            🎂 C&apos;est l&apos;anniversaire de {name} !
          </p>
          <p className="mt-1 text-sm text-white/80">
            {person.job_title || "Collaborateur"}
          </p>
        </div>
      </div>

      {/* Engagement stats */}
      {wishes.length > 0 && (
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-2">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
          >
            <Heart className="h-3 w-3 fill-pink-400 text-pink-400" />
            <span>{wishes.length} voeu{wishes.length > 1 ? "x" : ""}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-[11px] text-zinc-400 hover:text-zinc-600"
          >
            {wishes.length} commentaire{wishes.length > 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-b border-zinc-100">
        {!isMe && (
          <button
            onClick={handleLike}
            disabled={isPending}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
              liked
                ? "text-pink-500"
                : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-pink-500" : ""}`} />
            {liked ? "Voeu envoyé" : "J'aime"}
          </button>
        )}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
            showComments
              ? "text-blue-500"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Commenter
        </button>
      </div>

      {/* Comments / Wishes section */}
      {showComments && (
        <div className="border-t border-zinc-50 bg-zinc-50/50">
          {/* Scrollable wishes list */}
          {wishes.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto px-5 py-3">
              <div className="flex flex-col gap-2.5">
                {wishes.map((wish) => {
                  const sender = wish.from_user as {
                    first_name: string;
                    last_name: string;
                    avatar_url: string;
                  } | undefined;
                  const senderName = sender
                    ? `${sender.first_name} ${sender.last_name}`.trim()
                    : "Un collègue";
                  const senderInitials = sender
                    ? `${sender.first_name?.[0] ?? ""}${sender.last_name?.[0] ?? ""}`.toUpperCase()
                    : "?";
                  const timeAgo = formatDistanceToNow(new Date(wish.created_at), {
                    addSuffix: true,
                    locale: fr,
                  });
                  const isOwnWish = wish.from_user_id === currentUserId;
                  const isEditing = editingWishId === wish.id;

                  return (
                    <div key={wish.id} className="group flex gap-2">
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                        {sender?.avatar_url ? (
                          <Image
                            src={sender.avatar_url}
                            alt=""
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-500">
                            {senderInitials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="text"
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  saveEditWish();
                                }
                                if (e.key === "Escape") cancelEditWish();
                              }}
                              className="rounded-2xl bg-white px-3 py-1.5 text-xs text-[var(--heading)] shadow-xs ring-1 ring-pink-300 outline-none"
                              autoFocus
                            />
                            <div className="flex items-center gap-1 pl-1">
                              <button
                                onClick={saveEditWish}
                                disabled={editSaving || !editMessage.trim()}
                                className="flex items-center gap-1 text-[10px] font-medium text-pink-500 hover:text-pink-600 disabled:opacity-40"
                              >
                                <Check className="h-3 w-3" />
                                Enregistrer
                              </button>
                              <span className="text-zinc-300">·</span>
                              <button
                                onClick={cancelEditWish}
                                className="text-[10px] font-medium text-zinc-400 hover:text-zinc-600"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="inline-block rounded-2xl bg-white px-3 py-1.5 shadow-xs ring-1 ring-black/[0.04]">
                              <span className="text-xs font-semibold text-[var(--heading)]">
                                {senderName}
                              </span>
                              <p className="text-xs leading-relaxed text-[var(--text)]">
                                {wish.message}
                              </p>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 pl-1">
                              <span className="text-[10px] text-zinc-400">{timeAgo}</span>
                              {isOwnWish && (
                                <>
                                  <button
                                    onClick={() => startEditWish(wish)}
                                    className="hidden text-[10px] text-zinc-400 hover:text-pink-500 group-hover:inline-flex"
                                    title="Modifier"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWish(wish.id)}
                                    className="hidden text-[10px] text-zinc-400 hover:text-red-500 group-hover:inline-flex"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write a wish / comment input */}
          {(() => {
            const inputDisabled = isMe ? hasReplied : liked;
            const placeholder = isMe
              ? (hasReplied ? "Vous avez déjà répondu" : "Remercier vos collègues...")
              : (liked ? "Vous avez déjà envoyé vos voeux" : "Écrire un message d'anniversaire...");

            return (
              <div className="border-t border-zinc-100 px-5 py-3">
                {error && (
                  <p className="mb-2 text-[11px] text-red-500">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendWish();
                      }
                    }}
                    placeholder={placeholder}
                    disabled={inputDisabled}
                    className="flex-1 rounded-full bg-white px-4 py-2 text-xs text-[var(--heading)] shadow-xs ring-1 ring-black/[0.06] outline-none placeholder:text-zinc-400 focus:ring-pink-300 disabled:opacity-50"
                  />
                  {!inputDisabled && (
                    <button
                      onClick={handleSendWish}
                      disabled={isPending || !wishMessage.trim()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm transition-all hover:bg-pink-600 disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {isMe && wishes.length === 0 && (
            <div className="px-5 py-4 text-center text-xs text-zinc-400">
              Vos collègues vous souhaiteront un joyeux anniversaire ici 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
}
