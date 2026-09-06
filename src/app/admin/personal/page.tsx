import Link from "next/link";
import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Forbidden } from "@/app/admin/_components/forbidden";

const RESOURCES = [
  { href: "/admin/personal/profile", label: "پروفایل", description: "اطلاعات کلی، بیوگرافی و شبکه‌های اجتماعی" },
  { href: "/admin/personal/skills", label: "مهارت‌ها", description: "مدیریت مهارت‌های فنی" },
  { href: "/admin/personal/experience", label: "سوابق کاری", description: "مدیریت تایم‌لاین شغلی" },
  { href: "/admin/personal/education", label: "تحصیلات", description: "مدیریت تایم‌لاین تحصیلی" },
  { href: "/admin/personal/certificates", label: "گواهینامه‌ها", description: "مدیریت گواهینامه‌های حرفه‌ای" },
  { href: "/admin/personal/services", label: "خدمات", description: "مدیریت خدمات قابل ارائه" },
  { href: "/admin/personal/portfolio", label: "نمونه‌کارها", description: "مدیریت پروژه‌های نمونه‌کار" },
  { href: "/admin/personal/testimonials", label: "نظرات مشتریان", description: "مدیریت نظرات و بازخوردها" },
];

export default async function PersonalAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="برند شخصی" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">مدیریت برند شخصی</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardHeader>
                <CardTitle>{r.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted">{r.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
