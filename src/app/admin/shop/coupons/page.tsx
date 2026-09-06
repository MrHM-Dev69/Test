import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { CouponList } from "@/components/admin/shop/coupon-list";

export const metadata = { title: "کدهای تخفیف" };

export default async function AdminCouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="کدهای تخفیف" />;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">کدهای تخفیف</h1>
      <CouponList
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue.toString(),
          maxRedemptions: c.maxRedemptions,
          redeemedCount: c.redeemedCount,
          isActive: c.isActive,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
