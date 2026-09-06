import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardTitle } from "@/components/ui/card";
import { formatToman } from "@/lib/utils";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "داشبورد آکادمی" };

export default async function AcademyAdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="آکادمی" />;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCourses, distinctStudents, revenueAgg, progressAgg, pendingQuestions, pendingReviews] =
    await Promise.all([
      prisma.course.count(),
      prisma.enrollment.findMany({ distinct: ["userId"], select: { userId: true } }),
      prisma.transaction.aggregate({
        where: { category: "course_sale", type: "INCOME", occurredAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.enrollment.aggregate({ _avg: { progressPct: true } }),
      prisma.courseQuestion.count({ where: { answer: null } }),
      prisma.courseReview.count({ where: { isApproved: false } }),
    ]);

  const revenueThisMonth = Number(revenueAgg._sum.amount ?? 0);
  const completionRate = Math.round(progressAgg._avg.progressPct ?? 0);

  const stats = [
    { label: "تعداد دوره‌ها", value: totalCourses.toLocaleString("fa-IR") },
    { label: "تعداد دانشجویان", value: distinctStudents.length.toLocaleString("fa-IR") },
    { label: "درآمد این ماه", value: formatToman(revenueThisMonth) },
    { label: "میانگین پیشرفت", value: `${completionRate}٪` },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">داشبورد آکادمی</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-accent">{s.value}</p>
          </Card>
        ))}
      </div>

      {(pendingQuestions > 0 || pendingReviews > 0) && (
        <Card className="mt-6 border-amber-500/40">
          <CardTitle className="text-amber-400">در انتظار بررسی</CardTitle>
          <p className="mt-2 text-sm text-muted">
            {pendingQuestions} سوال بدون پاسخ و {pendingReviews} نظر در انتظار تایید وجود دارد.
          </p>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/academy/courses/new" className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
          افزودن دوره جدید
        </Link>
        <Link href="/admin/academy/enrollments" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          مدیریت ثبت‌نام‌ها
        </Link>
        <Link href="/admin/academy/questions" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          پاسخ به سوالات
        </Link>
        <Link href="/admin/academy/reviews" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          تایید نظرات
        </Link>
      </div>
    </div>
  );
}
