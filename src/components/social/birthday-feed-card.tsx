"use client";

import { useState, useTransition } from "react";
import { Cake, Heart, MessageSquare, Send } from "lucide-react";
import Image from "next/image";
import { sendBirthdayWish } from "@/actions/birthday";
import type { Profile } from "@/lib/types/database";

interface BirthdayFeedCardProps {
  person: Profile;
  currentUserId: string;
}

export default function BirthdayFeedCard({ person, currentUserId }: BirthdayFeedCardProps) {
  const [wished, setWished] = useState(false);
  const [wishMessage, setWishMessage] = useState("");
  const [showWishInput, setShowWishInput] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isMe = person.id === currentUserId;
  const name = `${person.first_name} ${person.last_name}`.trim();
  const initials = `${person.first_name?.[0] ?? ""}${person.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  function handleSendWish() {
    if (isMe) return;
    setError("");
    startTransition(async () => {
      const result = await sendBirthdayWish(
        person.id,
        wishMessage.trim() || "Joyeux anniversaire !"
      );
      if (result.success) {
        setWished(true);
        setShowWishInput(false);
        setWishMessage("");
      } else {
        setError(result.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs">
      {/* Birthday header with gradient */}
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
            {person.job_title || "Collaborateur"} • Souhaitez-lui une bonne journée !
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3">
        {isMe ? (
          <p className="text-center text-sm text-[var(--text-muted)]">
            🎉 Joyeux anniversaire à vous !
          </p>
        ) : (
          <>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (!wished) setShowWishInput(!showWishInput);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  wished
                    ? "bg-pink-50 text-pink-500"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${wished ? "fill-pink-500" : ""}`} />
                {wished ? "Voeux envoyés !" : "Souhaiter"}
              </button>
            </div>

            {/* Wish input */}
            {showWishInput && !wished && (
              <div className="mt-3 border-t border-zinc-100 pt-3">
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
                    placeholder="Joyeux anniversaire ! 🎂"
                    className="flex-1 rounded-full bg-zinc-50 px-4 py-2 text-xs text-[var(--heading)] outline-none placeholder:text-zinc-400 focus:bg-zinc-100 focus:ring-1 focus:ring-pink-300"
                  />
                  <button
                    onClick={handleSendWish}
                    disabled={isPending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm transition-all hover:bg-pink-600 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
