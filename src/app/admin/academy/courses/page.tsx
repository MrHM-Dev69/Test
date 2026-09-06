import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "دوره‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="دوره‌ها" />;

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, _count: { select: { sections: true, enrollments: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">دوره‌ها</h1>
        <Link href="/admin/academy/courses/new" className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
          افزودن دوره
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">عنوان</th>
                <th className="p-3 font-medium">دسته‌بندی</th>
                <th className="p-3 font-medium">قیمت</th>
                <th className="p-3 font-medium">دانشجویان</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted">
                    دوره‌ای ثبت نشده است.
                  </td>
                </tr>
              )}
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="p-3 text-foreground">{c.title}</td>
                  <td className="p-3 text-muted">{c.category.name}</td>
                  <td className="p-3 text-muted">{c.isFree ? "رایگان" : formatToman(Number(c.salePrice ?? c.price))}</td>
                  <td className="p-3 text-muted">{c._count.enrollments}</td>
                  <td className="p-3">
                    <Badge variant={c.isPublished ? "success" : "secondary"}>
                      {c.isPublished ? "منتشر شده" : "پیش‌نویس"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/academy/courses/${c.id}/edit`} className="text-accent hover:underline">
                      ویرایش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
