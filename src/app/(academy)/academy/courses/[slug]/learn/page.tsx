import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LearnRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/academy/courses/${slug}`);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { sections: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  if (!enrollment) redirect(`/academy/courses/${slug}?enroll=required`);

  const firstLessonId = course.sections[0]?.lessons[0]?.id;
  const targetLessonId = enrollment.lastLessonId ?? firstLessonId;

  if (!targetLessonId) redirect(`/academy/courses/${slug}`);
  redirect(`/academy/courses/${slug}/learn/${targetLessonId}`);
}
