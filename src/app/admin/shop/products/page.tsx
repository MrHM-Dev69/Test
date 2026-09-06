import Link from "next/link";
import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export const metadata = { title: "محصولات فروشگاه" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="محصولات فروشگاه" />;

  const { q } = await searchParams;

  const products = await prisma.product.findMany({
    where: q ? { title: { contains: q, mode: "insensitive" } } : undefined,
    include: { category: true, files: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">محصولات فروشگاه</h1>
        <Link href="/admin/shop/products/new" className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
          افزودن محصول
        </Link>
      </div>

      <form method="get" className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="جستجوی محصول..."
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-surface px-3 text-sm sm:w-80"
        />
      </form>

      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <Link key={p.id} href={`/admin/shop/products/${p.id}/edit`}>
            <Card className="flex items-center justify-between transition-colors hover:border-accent/40">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.category.name} — {p.files.length} فایل
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-accent">
                  {p.isFree ? "رایگان" : formatToman(Number(p.salePrice ?? p.price))}
                </span>
                {p.isPublished ? <Badge variant="success">منتشرشده</Badge> : <Badge variant="secondary">پیش‌نویس</Badge>}
                {p.files.length === 0 && p.productType !== "SERVICE" && (
                  <Badge variant="warning">بدون فایل</Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}
        {products.length === 0 && <p className="text-muted">محصولی یافت نشد.</p>}
      </div>
    </div>
  );
}
