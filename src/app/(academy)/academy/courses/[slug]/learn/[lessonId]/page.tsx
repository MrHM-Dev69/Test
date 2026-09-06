import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { MarkCompleteButton } from "@/components/academy/mark-complete-button";
import { QuizPlayer } from "@/components/academy/quiz-player";
import { cn } from "@/lib/utils";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/academy/courses/${slug}/learn/${lessonId}`);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const lesson = course.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });

  const hasAccess = Boolean(enrollment) || lesson.isPreview;
  if (!hasAccess) {
    redirect(`/academy/courses/${slug}?enroll=required`);
  }

  // "Continue where you left off": record this as the last-visited lesson,
  // but only for actually-enrolled users (a preview visitor has no Enrollment row).
  if (enrollment) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastLessonId: lessonId },
    });
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  const quiz =
    lesson.type === "QUIZ"
      ? await prisma.quiz.findUnique({
          where: { lessonId },
          include: { questions: { orderBy: { order: "asc" } } },
        })
      : null;

  const attachments = await prisma.lessonAttachment.findMany({ where: { lessonId } });

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const totalLessons = allLessons.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href={`/academy/courses/${slug}`} className="text-sm text-accent hover:underline">
          ← بازگشت به صفحه دوره
        </Link>
        <h1 className="mt-2 text-xl font-bold text-foreground">{course.title}</h1>
        {enrollment && (
          <div className="mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${enrollment.progressPct}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          {course.sections.map((section) => (
            <div key={section.id}>
              <p className="mb-1 text-xs font-semibold text-muted">{section.title}</p>
              <ul className="space-y-1">
                {section.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/academy/courses/${slug}/learn/${l.id}`}
                      className={cn(
                        "block rounded-lg px-2 py-1.5 text-sm",
                        l.id === lessonId ? "bg-accent text-white" : "text-muted hover:bg-white/5",
                      )}
                    >
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <div className="space-y-6 lg:col-span-3">
          <h2 className="text-lg font-semibold text-foreground">{lesson.title}</h2>

          {lesson.type === "VIDEO" && lesson.contentUrl && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              controls
              className="w-full rounded-xl border border-border bg-black"
              src={`/api/academy/lessons/${lesson.id}/video`}
            />
          )}

          {lesson.type === "ARTICLE" && lesson.contentBody && (
            <Card>
              <CardContent className="prose prose-invert max-w-none whitespace-pre-line pt-6 text-foreground">
                {lesson.contentBody}
              </CardContent>
            </Card>
          )}

          {lesson.type === "QUIZ" && quiz && (
            <QuizPlayer
              lessonId={lesson.id}
              questions={quiz.questions.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices }))}
            />
          )}

          {attachments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">فایل‌های ضمیمه</p>
              <ul className="space-y-1">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/academy/lessons/${lesson.id}/attachments/${a.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {enrollment && lesson.type !== "QUIZ" && (
            <MarkCompleteButton lessonId={lesson.id} initiallyCompleted={Boolean(progress?.isCompleted)} />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
            {currentIndex > 0 ? (
              <Link
                href={`/academy/courses/${slug}/learn/${allLessons[currentIndex - 1].id}`}
                className="text-accent hover:underline"
              >
                ← درس قبلی
              </Link>
            ) : (
              <span />
            )}
            {currentIndex < totalLessons - 1 ? (
              <Link
                href={`/academy/courses/${slug}/learn/${allLessons[currentIndex + 1].id}`}
                className="text-accent hover:underline"
              >
                درس بعدی →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
