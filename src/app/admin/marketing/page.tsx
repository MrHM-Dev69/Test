import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

export default async function MarketingHubPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return <Forbidden label="بازاریابی" />;

  const [bannersCount, faqCount, navCount] = await Promise.all([
    prisma.banner.count(),
    prisma.faqItem.count(),
    prisma.navigationItem.count(),
  ]);

  const links = [
    { href: "/admin/marketing/banners", title: "بنرها", desc: "مدیریت بنرهای تبلیغاتی صفحات", count: bannersCount },
    { href: "/admin/marketing/faq", title: "سوالات متداول", desc: "مدیریت سوالات پرتکرار سایت", count: faqCount },
    { href: "/admin/marketing/navigation", title: "منوهای سایت", desc: "ساخت منوی هدر و فوتر", count: navCount },
    { href: "/admin/shop/coupons", title: "کدهای تخفیف", desc: "مدیریت کدهای تخفیف فروشگاه", count: null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">بازاریابی</h1>
        <p className="mt-1 text-sm text-muted">مدیریت محتوای بازاریابی سایت</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardHeader>
                <CardTitle>{l.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{l.desc}</p>
                {l.count !== null && <p className="mt-2 text-lg font-bold">{l.count.toLocaleString("fa-IR")}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
