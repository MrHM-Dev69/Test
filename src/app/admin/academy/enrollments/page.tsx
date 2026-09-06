import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminGrantForm } from "./admin-grant-form";
import type { EnrollmentSource, RoleName } from "@prisma/client";

export const metadata = { title: "ثبت‌نام‌ها" };
export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<EnrollmentSource, string> = {
  PURCHASE: "خرید",
  FREE: "رایگان",
  ADMIN_GRANT: "اعطای دستی",
};

const PAGE_SIZE = 30;

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; source?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="ثبت‌نام‌ها" />;

  const sp = await searchParams;
  const pageNum = Math.max(1, Number(sp.page ?? "1") || 1);

  const where = {
    ...(sp.courseId ? { courseId: sp.courseId } : {}),
    ...(sp.source ? { source: sp.source as EnrollmentSource } : {}),
  };

  const [total, enrollments, courses] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true, course: true },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ثبت‌نام‌ها</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} ثبت‌نام</p>
      </div>

      <AdminGrantForm courses={courses} />

      <form className="flex flex-wrap gap-2" action="/admin/academy/enrollments">
        <select
          name="courseId"
          defaultValue={sp.courseId ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">همه دوره‌ها</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={sp.source ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">همه منابع</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          فیلتر
        </button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">دوره</th>
                <th className="p-3 font-medium">منبع</th>
                <th className="p-3 font-medium">پیشرفت</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    ثبت‌نامی یافت نشد.
                  </td>
                </tr>
              )}
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-border">
                  <td className="p-3 text-foreground">{e.user.name ?? e.user.email ?? e.user.phone}</td>
                  <td className="p-3 text-muted">{e.course.title}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{SOURCE_LABELS[e.source]}</Badge>
                  </td>
                  <td className="p-3 text-muted">{e.progressPct}٪</td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
