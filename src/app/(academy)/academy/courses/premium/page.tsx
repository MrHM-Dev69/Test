import Link from "next/link";
import type { Metadata } from "next";
import { getCourseCatalog } from "@/lib/academy/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = {
  title: "دوره‌های ویژه",
  description: "فهرست دوره‌های پولی و ویژه آکادمی.",
};

export default async function PremiumCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const { items, total } = await getCourseCatalog({ pricing: "paid", sort: "popular", page });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">دوره‌های ویژه</h1>
      <p className="text-sm text-muted">{total} دوره ویژه</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((course) => (
          <Link key={course.id} href={`/academy/courses/${course.slug}`}>
            <Card className="h-full transition-transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge>{formatToman(Number(course.salePrice ?? course.price))}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {items.length === 0 && <p className="text-muted">در حال حاضر دوره ویژه‌ای وجود ندارد.</p>}
      </div>
    </div>
  );
}
