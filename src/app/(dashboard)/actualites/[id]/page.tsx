import { notFound } from "next/navigation";
import {
  getNewsById,
  getNewsViewsCount,
  getNewsComments,
  getNewsLikesCount,
  getNewsSharesCount,
  hasUserLikedNews,
  getNewsAttachments,
  recordNewsView,
} from "@/actions/news";
import { getProfile } from "@/actions/auth";
import NewsDetail from "@/components/news/news-detail";


interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const [article, viewsCount, comments, likesCount, sharesCount, userHasLiked, attachments, profile] =
    await Promise.all([
      getNewsById(id),
      getNewsViewsCount(id),
      getNewsComments(id),
      getNewsLikesCount(id),
      getNewsSharesCount(id),
      hasUserLikedNews(id),
      getNewsAttachments(id),
      getProfile(),
    ]);

  if (!article) {
    notFound();
  }

  // Record view
  await recordNewsView(id);

  const canEdit =
    !!profile &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <NewsDetail
      article={article}
      viewsCount={viewsCount + 1}
      likesCount={likesCount}
      sharesCount={sharesCount}
      userHasLiked={userHasLiked}
      comments={comments}
      attachments={attachments}
      currentUserId={profile?.id ?? null}
      canEdit={canEdit}
    />
  );
}
