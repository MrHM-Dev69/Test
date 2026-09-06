import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "دوره‌های من" };

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy/my/courses");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true, certificate: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">دوره‌های من</h1>
      <div className="grid gap-4">
        {enrollments.map((e) => (
          <Card key={e.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{e.course.title}</CardTitle>
              {e.completedAt ? (
                <Badge variant="success">تکمیل شده</Badge>
              ) : (
                <Badge variant="secondary">{e.progressPct}٪</Badge>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${e.progressPct}%` }} />
              </div>
              <div className="flex gap-2">
                {e.certificate && (
                  <Link href="/academy/my/certificates" className="text-sm text-accent hover:underline">
                    مشاهده گواهینامه
                  </Link>
                )}
                <Link
                  href={`/academy/courses/${e.course.slug}/learn`}
                  className="text-sm text-accent hover:underline"
                >
                  ادامه یادگیری
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {enrollments.length === 0 && (
          <p className="text-muted">
            هنوز در دوره‌ای ثبت‌نام نکرده‌اید.{" "}
            <Link href="/academy/courses" className="text-accent hover:underline">
              مشاهده دوره‌ها
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
