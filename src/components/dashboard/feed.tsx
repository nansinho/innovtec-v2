import Image from "next/image";
import { Heart, MessageSquare, ChevronRight, Newspaper } from "lucide-react";
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
              className="flex gap-2.5 border-b border-[var(--border-1)] px-5 py-3.5 last:border-b-0"
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
                {author?.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt=""
                    fill
                    sizes="32px"
                    loading="lazy"
                    className="object-cover"
                  />
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

                {/* Linked news article card */}
                {linkedNews && (
                  <Link
                    href={`/actualites/${linkedNews.id}`}
                    className="mt-2 flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] p-3 transition-colors hover:bg-[var(--bg)]"
                  >
                    {linkedNews.image_url ? (
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-[var(--bg)]">
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
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--bg)]">
                        <Newspaper className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-[var(--heading)]">
                        {linkedNews.title}
                      </p>
                      {linkedNews.excerpt && (
                        <p className="mt-0.5 line-clamp-2 text-[10.5px] text-[var(--text-muted)]">
                          {linkedNews.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )}

                {/* Non-linked image */}
                {!linkedNews && post.image_url && (
                  <div className="relative mt-2 h-[150px] overflow-hidden rounded-[var(--radius-sm)]">
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
