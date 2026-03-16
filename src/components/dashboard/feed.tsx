import { ChevronRight, Rss } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { getFeedPosts } from "@/actions/feed";
import { getProfile } from "@/actions/auth";
import FeedList from "@/components/dashboard/feed-list";

export default async function Feed() {
  const [posts, profile] = await Promise.all([getFeedPosts(), getProfile()]);

  return (
    <Card>
      <CardHeader
        title="Fil d'actualités"
        icon={Rss}
        action={
          <Link
            href="/actualites"
            className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-900"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {posts.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <Rss className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            Aucune publication pour le moment
          </p>
        </div>
      ) : (
        <FeedList initialPosts={posts} currentUserId={profile?.id} />
      )}
    </Card>
  );
}
