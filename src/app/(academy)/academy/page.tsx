import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getFeaturedCourses, getCourseCategories } from "@/lib/academy/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = {
  title: "آکادمی",
  description: "دوره‌های آموزشی وب، وردپرس، FiveM، VMP و MTA به همراه مقالات و نقشه‌راه‌های یادگیری.",
};

export default async function AcademyHomePage() {
  const [featured, categories, freeCourses, recentArticles] = await Promise.all([
    getFeaturedCourses(6),
    getCourseCategories(),
    prisma.course.findMany({
      where: { isPublished: true, isFree: true },
      orderBy: { studentCount: "desc" },
      take: 4,
    }),
    prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">آکادمی برند شخصی</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          یادگیری برنامه‌نویسی وب، وردپرس، اسکریپت‌نویسی FiveM و MTA/VMP با دوره‌های عملی، مقالات و
          نقشه‌راه‌های یادگیری.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/academy/courses">مشاهده دوره‌ها</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/academy/courses/free">دوره‌های رایگان</Link>
          </Button>
        </div>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">دسته‌بندی‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} href={`/academy/courses?category=${c.slug}`}>
                <Badge variant="secondary" className="cursor-pointer text-sm">
                  {c.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">دوره‌های ویژه</h2>
          <Link href="/academy/courses" className="text-sm text-accent hover:underline">
            مشاهده همه
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <Link key={course.id} href={`/academy/courses/${course.slug}`}>
              <Card className="h-full transition-transform hover:-translate-y-1">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant={course.isFree ? "success" : "default"}>
                    {course.isFree ? "رایگان" : formatToman(Number(course.salePrice ?? course.price))}
                  </Badge>
                  <span className="text-xs text-muted">{course.studentCount} دانشجو</span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {featured.length === 0 && <p className="text-muted">دوره ویژه‌ای هنوز ثبت نشده است.</p>}
        </div>
      </section>

      {freeCourses.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">دوره‌های رایگان محبوب</h2>
            <Link href="/academy/courses/free" className="text-sm text-accent hover:underline">
              مشاهده همه
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {freeCourses.map((course) => (
              <Link key={course.id} href={`/academy/courses/${course.slug}`}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentArticles.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">مقالات و آموزش‌های اخیر</h2>
            <Link href="/academy/articles" className="text-sm text-accent hover:underline">
              مشاهده همه
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentArticles.map((a) => (
              <Link key={a.id} href={`/academy/articles/${a.slug}`}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base line-clamp-2">{a.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{a.excerpt}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
