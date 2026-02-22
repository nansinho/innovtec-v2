import Image from "next/image";
import { Heart, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";

interface FeedItem {
  avatar: string;
  name: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  comments: number;
}

const feedItems: FeedItem[] = [
  {
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    name: "Marc Lefèvre",
    time: "il y a 2h",
    text: "Retour d\u2019expérience positif sur le chantier fibre quartier Nord. Bonne coordination entre les équipes.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    likes: 12,
    comments: 4,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    name: "Sophie Laurent",
    time: "il y a 5h",
    text: "Rappel : le nouveau protocole EPI entre en vigueur le 1er mars. Consultez la section Documents.",
    likes: 8,
    comments: 2,
  },
];

export default function Feed() {
  return (
    <Card>
      <CardHeader
        title="Fil d\u2019actualités"
        action={
          <Link
            href="/actualites"
            className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {feedItems.map((item, i) => (
        <div
          key={i}
          className="flex gap-2.5 border-b border-[var(--border-1)] px-5 py-3.5 last:border-b-0"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <Image src={item.avatar} alt="" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[var(--heading)]">
                {item.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {item.time}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text)]">
              {item.text}
            </p>
            {item.image && (
              <div className="relative mt-2 h-[150px] overflow-hidden rounded-[var(--radius-sm)]">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="mt-2 flex gap-3.5">
              <button className="flex items-center gap-[3px] text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--yellow)]">
                <Heart className="h-[13px] w-[13px]" />
                {item.likes}
              </button>
              <button className="flex items-center gap-[3px] text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--yellow)]">
                <MessageSquare className="h-[13px] w-[13px]" />
                {item.comments}
              </button>
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
