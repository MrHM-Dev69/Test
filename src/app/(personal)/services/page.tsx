import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = {
  title: "خدمات",
  description: "فهرست کامل خدمات ارائه شده.",
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">خدمات</h1>
      {services.length === 0 ? (
        <p className="text-muted">هنوز خدمتی ثبت نشده است.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`}>
              <Card className="h-full transition-colors hover:border-accent/40">
                <CardTitle>{service.title}</CardTitle>
                {service.domain && <p className="mt-1 text-xs text-muted">{service.domain}</p>}
                <p className="mt-2 line-clamp-3 text-sm text-muted">{service.description}</p>
                {service.priceFrom != null && (
                  <p className="mt-3 text-sm text-accent">از {formatToman(Number(service.priceFrom))}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
