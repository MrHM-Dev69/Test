import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";
import { GeneralSettingsForm, SeoSettingsForm } from "./settings-forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LEGAL_PAGES: { slug: string; title: string }[] = [
  { slug: "terms", title: "قوانین و مقررات" },
  { slug: "privacy", title: "حریم خصوصی" },
  { slug: "refund-policy", title: "سیاست بازگشت وجه" },
  { slug: "license", title: "مجوز استفاده" },
  { slug: "cookie-policy", title: "سیاست کوکی" },
  { slug: "disclaimer", title: "سلب مسئولیت" },
];

interface GeneralSettingsValue {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface SeoSettingsValue {
  defaultTitle?: string;
  defaultDescription?: string;
}

export default async function SettingsPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "settings.manage")) return <Forbidden label="تنظیمات" />;

  const [generalSetting, seoSetting, pages] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "site_general" } }),
    prisma.setting.findUnique({ where: { key: "seo_defaults" } }),
    prisma.page.findMany({ where: { slug: { in: LEGAL_PAGES.map((p) => p.slug) } } }),
  ]);

  const general = (generalSetting?.value as GeneralSettingsValue | undefined) ?? {};
  const seo = (seoSetting?.value as SeoSettingsValue | undefined) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تنظیمات</h1>
        <p className="mt-1 text-sm text-muted">تنظیمات عمومی، سئو و صفحات قانونی سایت</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات عمومی سایت</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralSettingsForm initial={general} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سئو پیش‌فرض</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoSettingsForm initial={seo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>درگاه‌های فعال (فقط نمایش — تنظیم از طریق env.)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between rounded-lg border border-border/50 px-3 py-2">
            <span className="text-muted">درگاه پرداخت فعال</span>
            <span>{env.ACTIVE_PAYMENT_PROVIDER}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-border/50 px-3 py-2">
            <span className="text-muted">سرویس پیامک فعال</span>
            <span>{env.ACTIVE_SMS_PROVIDER}</span>
          </div>
          <p className="text-xs text-muted">
            این مقادیر از متغیرهای محیطی (.env) خوانده می‌شوند و از طریق پنل قابل تغییر نیستند.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>صفحات قانونی</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {LEGAL_PAGES.map((lp) => {
            const existing = pages.find((p) => p.slug === lp.slug);
            return (
              <Link
                key={lp.slug}
                href={`/admin/settings/legal/${lp.slug}`}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-white/5"
              >
                <span>{lp.title}</span>
                <span className="text-xs text-muted">{existing ? "ویرایش" : "ایجاد نشده — کلیک برای ساخت"}</span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
