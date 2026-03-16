"use client";

import { Gift } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader } from "@/components/ui/card";
import type { BirthdayWish } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MyBirthdayWishesProps {
  wishes: BirthdayWish[];
}

export default function MyBirthdayWishes({ wishes }: MyBirthdayWishesProps) {
  return (
    <Card>
      <CardHeader title="Vos voeux reçus" icon={Gift} />
      <div className="divide-y divide-[var(--border-1)]">
        {wishes.map((wish) => {
          const sender = wish.from_user as {
            first_name: string;
            last_name: string;
            avatar_url: string;
          } | undefined;
          const name = sender
            ? `${sender.first_name} ${sender.last_name}`.trim()
            : "Un collègue";
          const initials = sender
            ? `${sender.first_name?.[0] ?? ""}${sender.last_name?.[0] ?? ""}`.toUpperCase()
            : "?";
          const timeAgo = formatDistanceToNow(new Date(wish.created_at), {
            addSuffix: true,
            locale: fr,
          });

          return (
            <div key={wish.id} className="flex items-start gap-3 px-5 py-3">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-pink-100">
                {sender?.avatar_url ? (
                  <Image
                    src={sender.avatar_url}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-pink-600">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[var(--heading)]">
                  {name}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[var(--text)]">
                  {wish.message}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                  {timeAgo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
