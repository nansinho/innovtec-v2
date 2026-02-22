import Image from "next/image";
import { Heart, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { getFeedPosts } from "@/actions/feed";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function Feed() {
  const posts = await getFeedPosts();

  return (
    <Card>
      <CardHeader
        title="Fil d'actualités"
        action={
          <Link
            href="/actualites"
            className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {posts.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-[var(--text-muted)]">
          Aucune publication pour le moment
        </div>
      ) : (
        posts.map((post) => {
          const author = post.author as { first_name: string; last_name: string; avatar_url: string } | null;
          const authorName = author
            ? `${author.first_name} ${author.last_name}`.trim()
            : "Utilisateur";
          const timeAgo = formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: fr,
          });

          return (
            <div
              key={post.id}
              className="flex gap-2.5 border-b border-[var(--border-1)] px-5 py-3.5 last:border-b-0"
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
                {author?.avatar_url ? (
                  <Image src={author.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-[var(--text-muted)]">
                    {authorName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--heading)]">
                    {authorName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text)]">
                  {post.content}
                </p>
                {post.image_url && (
                  <div className="relative mt-2 h-[150px] overflow-hidden rounded-[var(--radius-sm)]">
                    <Image
                      src={post.image_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="mt-2 flex gap-3.5">
                  <button className="flex items-center gap-[3px] text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--yellow)]">
                    <Heart className="h-[13px] w-[13px]" />
                  </button>
                  <button className="flex items-center gap-[3px] text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--yellow)]">
                    <MessageSquare className="h-[13px] w-[13px]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
