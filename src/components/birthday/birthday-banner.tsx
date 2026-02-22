"use client";

import { useState, useTransition } from "react";
import { Cake, Send } from "lucide-react";
import { sendBirthdayWish } from "@/actions/birthday";
import type { Profile } from "@/lib/types/database";

interface BirthdayBannerProps {
  birthdays: Profile[];
  currentUserId: string;
}

export default function BirthdayBanner({
  birthdays,
  currentUserId,
}: BirthdayBannerProps) {
  const [sentWishes, setSentWishes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [activeWish, setActiveWish] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter out current user from birthday display
  const otherBirthdays = birthdays.filter((p) => p.id !== currentUserId);

  if (otherBirthdays.length === 0) return null;

  function handleSendWish(toUserId: string) {
    startTransition(async () => {
      const result = await sendBirthdayWish(
        toUserId,
        message.trim() || "Joyeux anniversaire !"
      );
      if (result.success) {
        setSentWishes((prev) => new Set([...prev, toUserId]));
        setActiveWish(null);
        setMessage("");
      }
    });
  }

  return (
    <div className="rounded-[var(--radius)] border border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cake className="h-5 w-5 text-pink-500" />
        <h3 className="text-sm font-semibold text-[var(--heading)]">
          Anniversaires du jour
        </h3>
      </div>

      <div className="space-y-2.5">
        {otherBirthdays.map((person) => {
          const initials =
            `${person.first_name?.[0] ?? ""}${person.last_name?.[0] ?? ""}`.toUpperCase() ||
            "?";
          const hasSent = sentWishes.has(person.id);

          return (
            <div key={person.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-200 text-[10px] font-bold text-pink-700">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-medium text-[var(--heading)]">
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)]">
                      {person.job_title || "Collaborateur"}
                    </p>
                  </div>
                </div>

                {hasSent ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-medium text-green-700">
                    Voeux envoyés
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setActiveWish(
                        activeWish === person.id ? null : person.id
                      )
                    }
                    className="rounded-full bg-pink-500 px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-pink-600"
                  >
                    Souhaiter
                  </button>
                )}
              </div>

              {/* Wish input */}
              {activeWish === person.id && !hasSent && (
                <div className="mt-2 flex gap-2 pl-10">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Joyeux anniversaire !"
                    className="flex-1 rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-[12px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-pink-400"
                  />
                  <button
                    onClick={() => handleSendWish(person.id)}
                    disabled={isPending}
                    className="rounded-lg bg-pink-500 px-3 py-1.5 text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
