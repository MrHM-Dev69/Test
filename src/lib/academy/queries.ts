import { prisma } from "@/lib/prisma";
import type { CourseLevel, Prisma, ProductDomain } from "@prisma/client";

export type CourseSort = "newest" | "popular" | "rating" | "price_asc" | "price_desc";

export interface CourseCatalogFilters {
  categorySlug?: string;
  domain?: ProductDomain;
  level?: CourseLevel;
  pricing?: "free" | "paid";
  q?: string;
  sort?: CourseSort;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 12;

function buildOrderBy(sort: CourseSort | undefined): Prisma.CourseOrderByWithRelationInput {
  switch (sort) {
    case "popular":
      return { studentCount: "desc" };
    case "rating":
      return { avgRating: "desc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export async function getCourseCatalog(filters: CourseCatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const where: Prisma.CourseWhereInput = {
    isPublished: true,
    ...(filters.domain ? { domain: filters.domain } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.pricing === "free" ? { isFree: true } : {}),
    ...(filters.pricing === "paid" ? { isFree: false } : {}),
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
    prisma.course.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeaturedCourses(limit = 6) {
  return prisma.course.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { category: true },
  });
}

export async function getRelatedCourses(courseId: string, categoryId: string, limit = 4) {
  return prisma.course.findMany({
    where: { isPublished: true, categoryId, id: { not: courseId } },
    orderBy: { studentCount: "desc" },
    take: limit,
  });
}

export async function getCourseCategories() {
  return prisma.category.findMany({
    where: { courses: { some: { isPublished: true } } },
    orderBy: { order: "asc" },
  });
}

export async function computeCourseProgress(courseId: string): Promise<number> {
  const totalLessons = await prisma.lesson.count({
    where: { section: { courseId } },
  });
  return totalLessons;
}

export async function getCourseTotalLessons(courseId: string): Promise<number> {
  return prisma.lesson.count({ where: { section: { courseId } } });
}

/** Recomputes and persists Enrollment.progressPct from completed LessonProgress rows. */
export async function recomputeEnrollmentProgress(userId: string, courseId: string) {
  const [totalLessons, completedCount] = await Promise.all([
    getCourseTotalLessons(courseId),
    prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: { section: { courseId } },
      },
    }),
  ]);

  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const enrollment = await prisma.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: {
      progressPct,
      ...(progressPct >= 100 ? { completedAt: new Date() } : {}),
    },
  });

  return { progressPct, enrollment };
}
