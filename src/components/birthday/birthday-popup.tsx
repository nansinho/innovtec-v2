"use client";

import { useState, useEffect } from "react";
import { X, PartyPopper } from "lucide-react";
import type { BirthdayWish } from "@/lib/types/database";

interface BirthdayPopupProps {
  wishes: BirthdayWish[];
  userName: string;
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    "#f5a623",
    "#1a2d4e",
    "#dc2626",
    "#16a34a",
    "#2563eb",
    "#7c3aed",
    "#ec4899",
    "#f59e0b",
  ];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 3;
  const duration = 3 + Math.random() * 2;
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;

  return (
    <div
      className="absolute animate-confetti-fall"
      style={{
        left: `${left}%`,
        top: "-20px",
        width: `${size}px`,
        height: `${size * 0.4}px`,
        backgroundColor: color,
        borderRadius: "2px",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  );
}

export default function BirthdayPopup({ wishes, userName }: BirthdayPopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("birthday-popup-dismissed");
    if (dismissed === new Date().toDateString()) {
      setIsVisible(false);
    }
  }, []);

  function handleClose() {
    setIsVisible(false);
    sessionStorage.setItem("birthday-popup-dismissed", new Date().toDateString());
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Popup card */}
      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/80 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-[var(--yellow)] to-[#ff8c00] px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Joyeux anniversaire !
          </h2>
          <p className="mt-1 text-sm text-white/80">{userName}</p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="mb-4 text-center text-sm text-[var(--text-secondary)]">
            Toute l&apos;équipe INNOVTEC Réseaux vous souhaite un merveilleux
            anniversaire !
          </p>

          {/* Wishes */}
          {wishes.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Messages de vos collègues
              </p>
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {wishes.map((wish) => (
                  <div
                    key={wish.id}
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-[12px] text-[var(--text)]">
                      {wish.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      — {(wish.from_user as unknown as { first_name: string; last_name: string })?.first_name ?? "Un collègue"}{" "}
                      {(wish.from_user as unknown as { first_name: string; last_name: string })?.last_name ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-[var(--radius-sm)] bg-[var(--yellow)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--yellow-hover)]"
          >
            Merci !
          </button>
        </div>
      </div>
    </div>
  );
}
