import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { GiftCardList } from "@/components/admin/shop/gift-card-list";

export const metadata = { title: "کارت‌های هدیه" };

export default async function AdminGiftCardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="کارت‌های هدیه" />;

  const giftCards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">کارت‌های هدیه</h1>
      <GiftCardList
        giftCards={giftCards.map((g) => ({
          id: g.id,
          code: g.code,
          initialValue: g.initialValue.toString(),
          balance: g.balance.toString(),
          isActive: g.isActive,
        }))}
      />
    </div>
  );
}
