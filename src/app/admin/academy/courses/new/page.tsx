import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { CourseForm } from "../course-form";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "افزودن دوره" };

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="دوره‌ها" />;

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">افزودن دوره جدید</h1>
      <Card>
        <CardContent className="pt-6">
          <CourseForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
