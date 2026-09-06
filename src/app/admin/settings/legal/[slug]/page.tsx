import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../../../_lib/guard";
import { Forbidden } from "../../../_components/forbidden";
import { LegalPageEditor } from "./editor";

export const dynamic = "force-dynamic";

const LEGAL_TITLES: Record<string, string> = {
  terms: "قوانین و مقررات",
  privacy: "حریم خصوصی",
  "refund-policy": "سیاست بازگشت وجه",
  license: "مجوز استفاده",
  "cookie-policy": "سیاست کوکی",
  disclaimer: "سلب مسئولیت",
};

export default async function LegalPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "settings.manage")) return <Forbidden label="تنظیمات" />;

  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LEGAL_TITLES[slug] ?? slug}</h1>
        <p className="mt-1 text-sm text-muted">/legal/{slug}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ویرایش محتوا</CardTitle>
        </CardHeader>
        <CardContent>
          <LegalPageEditor
            slug={slug}
            initial={{
              title: page?.title ?? LEGAL_TITLES[slug] ?? slug,
              body: page?.body ?? "",
              isPublished: page?.isPublished ?? true,
              seoTitle: page?.seoTitle ?? "",
              seoDescription: page?.seoDescription ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
