import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "../../course-form";
import { SectionsManager } from "./sections-manager";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "ویرایش دوره" };
export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="دوره‌ها" />;

  const [course, categories] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: { attachments: true, quiz: { include: { questions: { orderBy: { order: "asc" } } } } },
            },
          },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">ویرایش دوره: {course.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات دوره</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm course={course} categories={categories} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">سرفصل‌ها و درس‌ها</h2>
        <SectionsManager courseId={course.id} sections={course.sections} />
      </div>
    </div>
  );
}
