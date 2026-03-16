import { ChevronRight, Rss } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader } from "@/components/ui/card";
import { getFeedPosts } from "@/actions/feed";
import { getPublishedNews } from "@/actions/news";
import { getProfile } from "@/actions/auth";
import FeedList from "@/components/dashboard/feed-list";
import { formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ARTICLE_IMPORTANCE_MAP } from "@/lib/status-config";
import type { NewsPriority } from "@/lib/types/database";

export default async function Feed() {
  const [posts, profile, allNews] = await Promise.all([
    getFeedPosts(),
    getProfile(),
    getPublishedNews().catch(() => []),
  ]);

  const latestNews = allNews.slice(0, 3);

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

      {/* Latest news cards */}
      {latestNews.length > 0 && (
        <div className="grid grid-cols-1 gap-3 px-5 pb-4 sm:grid-cols-3">
          {latestNews.map((article) => {
            const priority = article.priority as NewsPriority;
            const priorityEntry =
              priority === "urgent"
                ? { label: "Urgent", variant: "red" as const }
                : ARTICLE_IMPORTANCE_MAP[priority];

            return (
              <Link
                key={article.id}
                href={`/actualites/${article.id}`}
                className="group overflow-hidden rounded-xl bg-zinc-50/80 ring-1 ring-zinc-950/[0.04] transition-all hover:shadow-md hover:ring-zinc-950/[0.08]"
              >
                <div className="relative h-28 w-full overflow-hidden bg-zinc-200">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Rss className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    {priority !== "normal" && priorityEntry && (
                      <Badge variant={priorityEntry.variant} dot>
                        {priorityEntry.label}
                      </Badge>
                    )}
                    {article.published_at && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatRelative(article.published_at)}
                      </span>
                    )}
                  </div>
                  <h4 className="line-clamp-2 text-xs font-semibold text-[var(--heading)] group-hover:text-[var(--yellow)]">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-muted)]">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Feed posts */}
      {posts.length === 0 && latestNews.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <Rss className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Aucune publication pour le moment
          </p>
        </div>
      ) : posts.length > 0 ? (
        <FeedList initialPosts={posts} currentUserId={profile?.id} />
      ) : null}
    </Card>
  );
}
