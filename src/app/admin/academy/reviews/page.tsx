import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { ReviewsList } from "./reviews-list";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "نظرات دوره‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="نظرات" />;

  const reviews = await prisma.courseReview.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: { user: true, course: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">نظرات دوره‌ها</h1>
      <ReviewsList reviews={reviews} />
    </div>
  );
}
