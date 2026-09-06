import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { ReviewModeration } from "@/components/admin/shop/review-moderation";

export const metadata = { title: "نظرات فروشگاه" };

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="نظرات" />;

  const reviews = await prisma.review.findMany({
    where: { isApproved: false },
    include: { product: { select: { title: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">نظرات در انتظار بررسی</h1>
      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          productTitle: r.product.title,
          userName: r.user.name ?? r.user.email ?? "کاربر",
        }))}
      />
    </div>
  );
}
