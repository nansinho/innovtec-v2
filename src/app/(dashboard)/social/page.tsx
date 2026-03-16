import { Rss } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getFeedPosts } from "@/actions/feed";
import { getTodayBirthdays, getUpcomingBirthdays, getBirthdayWishesFor } from "@/actions/birthday";
import { getProfile } from "@/actions/auth";
import FeedList from "@/components/dashboard/feed-list";
import UpcomingBirthdays from "@/components/social/upcoming-birthdays";
import BirthdayFeedCard from "@/components/social/birthday-feed-card";
import CreatePost from "@/components/social/create-post";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [posts, birthdays, upcomingBirthdays, profile] = await Promise.all([
    getFeedPosts(),
    getTodayBirthdays(),
    getUpcomingBirthdays(30),
    getProfile(),
  ]);

  // Fetch wishes for each birthday person
  const birthdayWishesMap = new Map<string, Awaited<ReturnType<typeof getBirthdayWishesFor>>>();
  await Promise.all(
    birthdays.map(async (person) => {
      const wishes = await getBirthdayWishesFor(person.id);
      birthdayWishesMap.set(person.id, wishes);
    })
  );

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          <CreatePost />

          {/* Birthday cards in the feed */}
          {birthdays.map((person) => (
            <BirthdayFeedCard
              key={person.id}
              person={person}
              currentUserId={profile?.id ?? ""}
              initialWishes={birthdayWishesMap.get(person.id) ?? []}
            />
          ))}

          {/* Regular feed posts */}
          <Card>
            <CardHeader
              title="Fil d'actualités"
              icon={Rss}
            />
            {posts.length === 0 && birthdays.length === 0 ? (
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
            ) : posts.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">
                Aucune publication pour le moment
              </div>
            ) : (
              <FeedList initialPosts={posts} currentUserId={profile?.id} />
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <UpcomingBirthdays birthdays={upcomingBirthdays} />
        </div>
      </div>
    </div>
  );
}
