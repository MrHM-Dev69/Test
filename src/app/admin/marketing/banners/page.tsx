import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { BannerManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return <Forbidden label="بنرها" />;

  const banners = await prisma.banner.findMany({ orderBy: [{ order: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">بنرهای تبلیغاتی</h1>
        <p className="mt-1 text-sm text-muted">{banners.length.toLocaleString("fa-IR")} بنر</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بنر جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <BannerManager banners={banners} />
        </CardContent>
      </Card>
    </div>
  );
}
