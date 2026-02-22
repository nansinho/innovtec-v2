import { notFound } from "next/navigation";
import {
  getNewsById,
  getNewsViewsCount,
  getNewsComments,
  recordNewsView,
} from "@/actions/news";
import { getProfile } from "@/actions/auth";
import NewsDetail from "@/components/news/news-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const [article, viewsCount, comments, profile] = await Promise.all([
    getNewsById(id),
    getNewsViewsCount(id),
    getNewsComments(id),
    getProfile(),
  ]);

  if (!article) {
    notFound();
  }

  // Record view
  await recordNewsView(id);

  return (
    <NewsDetail
      article={article}
      viewsCount={viewsCount + 1}
      comments={comments}
      currentUserId={profile?.id ?? null}
    />
  );
}
