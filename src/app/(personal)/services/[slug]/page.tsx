import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { formatToman } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getService(slug: string) {
  return prisma.service.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "خدمت یافت نشد" };

  const description = service.description.slice(0, 160);
  return {
    title: service.title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.title, description, type: "website" },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service || !service.isActive) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: "خدمات", url: "/services" },
          { name: service.title, url: `/services/${service.slug}` },
        ]}
      />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/services" className="hover:text-accent">
          خدمات
        </Link>{" "}
        / {service.title}
      </nav>

      <h1 className="text-3xl font-bold">{service.title}</h1>
      {service.domain && <p className="mt-2 text-sm text-muted">حوزه: {service.domain}</p>}
      {service.priceFrom != null && (
        <p className="mt-3 text-lg text-accent">شروع قیمت از {formatToman(Number(service.priceFrom))}</p>
      )}

      <p className="mt-8 whitespace-pre-line leading-8 text-muted">{service.description}</p>

      <div className="mt-10">
        <Button asChild size="lg">
          <Link href="/contact">درخواست این خدمت</Link>
        </Button>
      </div>
    </div>
  );
}
