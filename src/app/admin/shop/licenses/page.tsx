import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "لایسنس‌ها" };

export default async function AdminLicensesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="لایسنس‌ها" />;

  // License has no Prisma relations to User/Product (plain foreign-key
  // strings in the schema), so related data is joined manually here.
  const licenses = await prisma.license.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  const userIds = [...new Set(licenses.map((l) => l.userId))];
  const productIds = [...new Set(licenses.map((l) => l.productId))];

  const [users, products] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } }),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">لایسنس‌های صادرشده (فقط نمایش)</h1>
      <div className="flex flex-col gap-2">
        {licenses.map((l) => {
          const u = userMap.get(l.userId);
          const p = productMap.get(l.productId);
          return (
            <Card key={l.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-mono">{l.key}</p>
                <p className="mt-1 text-xs text-muted">
                  {p?.title ?? "—"} — {u?.name ?? u?.email ?? "—"}
                </p>
              </div>
              <Badge variant={l.isActive ? "success" : "secondary"}>{l.isActive ? "فعال" : "غیرفعال"}</Badge>
            </Card>
          );
        })}
        {licenses.length === 0 && <p className="text-muted">لایسنسی صادر نشده است.</p>}
      </div>
    </div>
  );
}
