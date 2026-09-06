import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "دانشجویان" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="دانشجویان" />;

  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = {
    enrollments: { some: {} },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, students] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { enrollments: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">دانشجویان</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} دانشجو</p>
      </div>

      <form className="flex gap-2" action="/admin/academy/students">
        <Input name="q" defaultValue={q} placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس..." className="max-w-sm" />
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نام</th>
                <th className="p-3 font-medium">ایمیل</th>
                <th className="p-3 font-medium">تلفن</th>
                <th className="p-3 font-medium">تعداد ثبت‌نام</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">
                    دانشجویی یافت نشد.
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="p-3 text-foreground">{s.name ?? "—"}</td>
                  <td className="p-3 text-muted">{s.email ?? "—"}</td>
                  <td className="p-3 text-muted">{s.phone ?? "—"}</td>
                  <td className="p-3 text-muted">{s._count.enrollments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
