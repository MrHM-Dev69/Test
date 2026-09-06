import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";

export const metadata = { title: "دانلودهای ثبت‌شده" };

export default async function AdminDownloadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="دانلودها" />;

  const downloads = await prisma.download.findMany({
    include: { user: { select: { name: true, email: true } }, product: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">دانلودهای ثبت‌شده (فقط نمایش)</h1>
      <div className="flex flex-col gap-2">
        {downloads.map((d) => (
          <Card key={d.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{d.product.title}</p>
              <p className="text-xs text-muted">{d.user.name ?? d.user.email}</p>
            </div>
            <div className="text-left text-xs text-muted">
              <p>
                {d.downloadCount}
                {d.downloadLimit !== null ? ` / ${d.downloadLimit}` : " / نامحدود"} دانلود
              </p>
              {d.expiresAt && <p>انقضا: {new Date(d.expiresAt).toLocaleDateString("fa-IR")}</p>}
            </div>
          </Card>
        ))}
        {downloads.length === 0 && <p className="text-muted">دانلودی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
