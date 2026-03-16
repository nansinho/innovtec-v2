import { Heart, Rss } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getFeedPosts } from "@/actions/feed";
import { getTodayBirthdays } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import FeedList from "@/components/dashboard/feed-list";
import BirthdayBanner from "@/components/birthday/birthday-banner";
import CreatePost from "@/components/social/create-post";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [posts, birthdays, profile] = await Promise.all([
    getFeedPosts(),
    getTodayBirthdays(),
    getProfile(),
  ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">
          Vie sociale
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Partagez, échangez et célébrez avec vos collègues
        </p>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {birthdays.length > 0 && profile && (
          <BirthdayBanner
            birthdays={birthdays}
            currentUserId={profile.id}
          />
        )}

        <CreatePost />

        <Card>
          <CardHeader
            title="Fil d'actualités"
            icon={Rss}
          />
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <Rss className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)]">
                Aucune publication pour le moment
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Soyez le premier à publier !
              </p>
            </div>
          ) : (
            <FeedList initialPosts={posts} />
          )}
        </Card>
      </div>
    </div>
  );
}
