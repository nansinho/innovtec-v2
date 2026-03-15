import Image from "next/image";
import { Heart, MessageSquare, ChevronRight, Newspaper, Rss } from "lucide-react";
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
        icon={Rss}
        action={
          <Link
            href="/actualites"
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {posts.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <Rss className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Aucune publication pour le moment
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const author = post.author as {
            first_name: string;
            last_name: string;
            avatar_url: string;
          } | null;
          const authorName = author
            ? `${author.first_name} ${author.last_name}`.trim()
            : "Utilisateur";
          const timeAgo = formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: fr,
          });

          const linkedNews = post.news as {
            id: string;
            title: string;
            image_url: string;
            excerpt: string;
          } | null;

          return (
            <div
              key={post.id}
              className="flex gap-3 border-b border-zinc-100 px-5 py-4 last:border-b-0"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-amber-500/20">
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--heading)]">
                    {authorName}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {timeAgo}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text)]">
                  {post.content}
                </p>

                {linkedNews && (
                  <Link
                    href={`/actualites/${linkedNews.id}`}
                    className="mt-2.5 flex items-start gap-3 rounded-xl bg-zinc-50/80 p-3 shadow-xs ring-1 ring-zinc-950/[0.04] transition-all hover:bg-zinc-50 hover:shadow-sm"
                  >
                    {linkedNews.image_url ? (
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                        <Image
                          src={linkedNews.image_url}
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
                        {linkedNews.title}
                      </p>
                      {linkedNews.excerpt && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">
                          {linkedNews.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )}

                {!linkedNews && post.image_url && (
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

                <div className="mt-2.5 flex gap-4">
                  <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500">
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-all hover:bg-blue-50 hover:text-blue-500">
                    <MessageSquare className="h-3.5 w-3.5" />
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
