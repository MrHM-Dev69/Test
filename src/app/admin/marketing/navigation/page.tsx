import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { NavigationManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return <Forbidden label="منوهای سایت" />;

  const items = await prisma.navigationItem.findMany({ orderBy: [{ order: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">منوهای سایت</h1>
        <p className="mt-1 text-sm text-muted">مدیریت آیتم‌های منوی هدر و فوتر</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>آیتم‌های منو</CardTitle>
        </CardHeader>
        <CardContent>
          <NavigationManager items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
