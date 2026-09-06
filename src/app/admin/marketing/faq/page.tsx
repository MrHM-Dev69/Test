import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { FaqManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return <Forbidden label="سوالات متداول" />;

  const items = await prisma.faqItem.findMany({ orderBy: [{ order: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">سوالات متداول</h1>
        <p className="mt-1 text-sm text-muted">{items.length.toLocaleString("fa-IR")} سوال</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>مدیریت سوالات</CardTitle>
        </CardHeader>
        <CardContent>
          <FaqManager items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
