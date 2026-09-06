import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ContentType } from "@prisma/client";

export async function ContentTypeList({ type, emptyLabel }: { type: ContentType; emptyLabel: string }) {
  const items = await prisma.article.findMany({
    where: { isPublished: true, type },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <Link key={a.id} href={`/academy/articles/${a.slug}`}>
          <Card className="h-full transition-transform hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="line-clamp-2">{a.title}</CardTitle>
              <CardDescription className="line-clamp-3">{a.excerpt}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
      {items.length === 0 && <p className="text-muted">{emptyLabel}</p>}
    </div>
  );
}
