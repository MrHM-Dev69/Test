import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { DownloadButton } from "@/components/shop/download-button";

export const metadata: Metadata = { title: "دانلودهای من" };

export default async function DownloadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const downloads = await prisma.download.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">دانلودهای من</h1>
      {downloads.length === 0 ? (
        <p className="text-muted">هنوز محصولی برای دانلود ندارید.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {downloads.map((d) => {
            const expired = d.expiresAt ? d.expiresAt < new Date() : false;
            const limitReached = d.downloadLimit !== null && d.downloadCount >= d.downloadLimit;
            return (
              <Card key={d.id} className="flex items-center justify-between">
                <div>
                  <Link href={`/shop/products/${d.product.slug}`} className="font-medium hover:text-accent">
                    {d.product.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    تعداد دانلود: {d.downloadCount}
                    {d.downloadLimit !== null ? ` از ${d.downloadLimit}` : " (نامحدود)"}
                    {d.expiresAt && ` — انقضا: ${new Date(d.expiresAt).toLocaleDateString("fa-IR")}`}
                  </p>
                </div>
                {expired || limitReached ? (
                  <span className="text-xs text-red-400">{expired ? "منقضی شده" : "سقف دانلود پر شده"}</span>
                ) : (
                  <DownloadButton productId={d.productId} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
