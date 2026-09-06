import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import type { ContentType } from "@prisma/client";

const TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "مقاله",
  TUTORIAL: "آموزش",
  ROADMAP: "نقشه‌راه",
  RESOURCE: "منبع",
};

const TYPE_LISTING_PATH: Record<ContentType, string> = {
  ARTICLE: "/academy/articles",
  TUTORIAL: "/academy/tutorials",
  ROADMAP: "/academy/roadmaps",
  RESOURCE: "/academy/resources",
};

async function getArticle(slug: string) {
  return prisma.article.findUnique({ where: { slug, isPublished: true } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? article.body.slice(0, 160),
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  // Best-effort view counter — not gated behind auth/session, fire-and-forget.
  await prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <ArticleJsonLd
        headline={article.title}
        description={article.excerpt ?? article.body.slice(0, 160)}
        slug={article.slug}
        datePublished={article.publishedAt?.toISOString()}
        authorName={article.authorName ?? undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "آکادمی", url: "/academy" },
          { name: TYPE_LABELS[article.type], url: TYPE_LISTING_PATH[article.type] },
          { name: article.title, url: `/academy/articles/${article.slug}` },
        ]}
      />

      <Badge variant="secondary">{TYPE_LABELS[article.type]}</Badge>
      <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
      {article.authorName && <p className="text-sm text-muted">نویسنده: {article.authorName}</p>}
      <div className="whitespace-pre-line leading-8 text-foreground">{article.body}</div>
    </div>
  );
}
