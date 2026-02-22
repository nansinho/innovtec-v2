"use client";

import dynamic from "next/dynamic";
import type { BirthdayWish } from "@/lib/types/database";

const BirthdayPopup = dynamic(
  () => import("@/components/birthday/birthday-popup"),
  { ssr: false }
);

interface Props {
  wishes: BirthdayWish[];
  userName: string;
}

export default function BirthdayPopupWrapper({ wishes, userName }: Props) {
  return <BirthdayPopup wishes={wishes} userName={userName} />;
}
