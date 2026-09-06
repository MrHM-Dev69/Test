import { prisma } from "@/lib/prisma";

/** True if the user is enrolled in the course that owns this lesson, or the lesson is a free preview. */
export async function userCanAccessLesson(userId: string | null, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { isPreview: true, section: { select: { courseId: true } } },
  });
  if (!lesson) return false;
  if (lesson.isPreview) return true;
  if (!userId) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.section.courseId } },
    select: { id: true },
  });
  return Boolean(enrollment);
}

export async function getUserEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
}
