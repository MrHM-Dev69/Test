import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string) {
  return prisma.portfolioProject.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "نمونه‌کار یافت نشد" };

  const description = project.description.slice(0, 160);
  return {
    title: project.title,
    description,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      images: project.images[0] ? [{ url: project.images[0] }] : undefined,
      type: "article",
    },
  };
}

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: "نمونه‌کارها", url: "/portfolio" },
          { name: project.title, url: `/portfolio/${project.slug}` },
        ]}
      />

      <nav className="mb-6 text-sm text-muted">
        <Link href="/portfolio" className="hover:text-accent">
          نمونه‌کارها
        </Link>{" "}
        / {project.title}
      </nav>

      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {formatFa(project.date)}
        {project.category ? ` — ${project.category}` : ""}
      </p>

      {project.images.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {project.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img} src={img} alt={project.title} className="w-full rounded-lg object-cover" />
          ))}
        </div>
      )}

      <p className="mt-8 whitespace-pre-line leading-8 text-muted">{project.description}</p>

      {project.features.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">امکانات</h2>
          <ul className="list-inside list-disc space-y-1 text-muted">
            {project.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {project.technologies.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">تکنولوژی‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        {project.liveUrl && (
          <Button asChild>
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              مشاهده نسخه زنده
            </a>
          </Button>
        )}
        {project.repoUrl && (
          <Button asChild variant="secondary">
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              مشاهده کد منبع
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
