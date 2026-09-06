import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });

  if (!page || !page.isPublished) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{page.title}</h1>
      <div
        className="prose prose-invert max-w-none text-sm leading-7 text-muted [&_a]:text-accent [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
