import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getRelatedCourses } from "@/lib/academy/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { formatToman } from "@/lib/utils";
import { EnrollButton } from "@/components/academy/enroll-button";
import { CourseReviewForm } from "@/components/academy/review-form";
import { CourseQuestionForm } from "@/components/academy/question-form";
import type { CourseLevel, LessonType } from "@prisma/client";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

const TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "ویدیو",
  ARTICLE: "مقاله",
  QUIZ: "آزمون",
  ATTACHMENT: "فایل ضمیمه",
};

async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: true,
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.description.slice(0, 160),
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const user = await getCurrentUser();

  const [enrollment, reviews, ownPendingReview, questions, related] = await Promise.all([
    user
      ? prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
        })
      : null,
    prisma.courseReview.findMany({
      where: { courseId: course.id, isApproved: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    user
      ? prisma.courseReview.findFirst({
          where: { courseId: course.id, userId: user.id, isApproved: false },
        })
      : null,
    prisma.courseQuestion.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getRelatedCourses(course.id, course.categoryId),
  ]);

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const isEnrolled = Boolean(enrollment);
  const price = Number(course.salePrice ?? course.price);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <CourseJsonLd name={course.title} description={course.description} slug={course.slug} />
      <BreadcrumbJsonLd
        items={[
          { name: "آکادمی", url: "/academy" },
          { name: "دوره‌ها", url: "/academy/courses" },
          { name: course.title, url: `/academy/courses/${course.slug}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{course.category.name}</Badge>
            <Badge variant="secondary">{LEVEL_LABELS[course.level]}</Badge>
            {course.durationMinutes && (
              <Badge variant="secondary">{Math.round(course.durationMinutes / 60)} ساعت</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="whitespace-pre-line text-muted">{course.description}</p>

          {course.requirements && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">پیش‌نیازها</h2>
              <p className="whitespace-pre-line text-sm text-muted">{course.requirements}</p>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              سرفصل‌های دوره ({totalLessons} درس)
            </h2>
            <div className="space-y-4">
              {course.sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-border">
                      {section.lessons.map((lesson) => {
                        const unlocked = isEnrolled || lesson.isPreview;
                        const content = (
                          <div className="flex items-center justify-between py-2 text-sm">
                            <span className={unlocked ? "text-foreground" : "text-muted"}>
                              {unlocked ? "▶" : "🔒"} {lesson.title}
                            </span>
                            <span className="text-xs text-muted">
                              {TYPE_LABELS[lesson.type]}
                              {lesson.isPreview && !isEnrolled ? " · پیش‌نمایش" : ""}
                            </span>
                          </div>
                        );
                        return (
                          <li key={lesson.id}>
                            {unlocked ? (
                              <Link href={`/academy/courses/${course.slug}/learn/${lesson.id}`}>
                                {content}
                              </Link>
                            ) : (
                              content
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">نظرات دانشجویان</h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-6">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{r.user.name ?? "کاربر"}</span>
                      <span className="text-accent">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="text-sm text-muted">{r.content}</p>
                  </CardContent>
                </Card>
              ))}
              {ownPendingReview && (
                <Card className="border border-amber-500/30">
                  <CardContent className="pt-6">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">نظر شما (در انتظار تایید)</span>
                      <span className="text-accent">{"★".repeat(ownPendingReview.rating)}</span>
                    </div>
                    <p className="text-sm text-muted">{ownPendingReview.content}</p>
                  </CardContent>
                </Card>
              )}
              {reviews.length === 0 && !ownPendingReview && (
                <p className="text-sm text-muted">هنوز نظری ثبت نشده است.</p>
              )}
            </div>
            {isEnrolled && !ownPendingReview && <div className="mt-4"><CourseReviewForm courseId={course.id} /></div>}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">پرسش و پاسخ</h2>
            <div className="space-y-3">
              {questions.map((q) => (
                <Card key={q.id}>
                  <CardContent className="space-y-2 pt-6">
                    <p className="text-sm text-foreground">{q.question}</p>
                    {q.answer && <p className="text-sm text-accent">پاسخ: {q.answer}</p>}
                  </CardContent>
                </Card>
              ))}
              {questions.length === 0 && <p className="text-sm text-muted">سوالی ثبت نشده است.</p>}
            </div>
            {user && <div className="mt-4"><CourseQuestionForm courseId={course.id} /></div>}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="text-2xl font-bold text-foreground">
                {course.isFree ? "رایگان" : formatToman(price)}
              </div>
              {isEnrolled ? (
                <Link href={`/academy/courses/${course.slug}/learn`}>
                  <button className="h-11 w-full rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent-hover">
                    ادامه یادگیری
                  </button>
                </Link>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  isFree={course.isFree}
                  isLoggedIn={Boolean(user)}
                  courseSlug={course.slug}
                />
              )}
              <ul className="space-y-1 text-sm text-muted">
                <li>سطح: {LEVEL_LABELS[course.level]}</li>
                <li>تعداد درس: {totalLessons}</li>
                <li>دانشجویان: {course.studentCount}</li>
                {course.avgRating > 0 && <li>امتیاز: {course.avgRating.toFixed(1)} از ۵</li>}
              </ul>
            </CardContent>
          </Card>

          {related.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">دوره‌های مرتبط</h3>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link key={r.id} href={`/academy/courses/${r.slug}`}>
                    <Card className="p-3 text-sm hover:bg-white/5">{r.title}</Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
