import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, courses, articles, portfolioProjects] = await Promise.all([
    prisma.product.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.course.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.article.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.portfolioProject.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/contact",
    "/shop",
    "/academy",
  ].map((route) => ({ url: `${env.APP_URL}${route}`, lastModified: new Date() }));

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${env.APP_URL}/shop/products/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...courses.map((c) => ({
      url: `${env.APP_URL}/academy/courses/${c.slug}`,
      lastModified: c.updatedAt,
    })),
    ...articles.map((a) => ({
      url: `${env.APP_URL}/academy/articles/${a.slug}`,
      lastModified: a.updatedAt,
    })),
    ...portfolioProjects.map((p) => ({
      url: `${env.APP_URL}/portfolio/${p.slug}`,
      lastModified: p.createdAt,
    })),
  ];
}
