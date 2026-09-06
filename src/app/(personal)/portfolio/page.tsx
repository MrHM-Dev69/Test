import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PortfolioFilter } from "./portfolio-filter";

export const metadata: Metadata = {
  title: "نمونه‌کارها",
  description: "نمونه پروژه‌های انجام شده به تفکیک دسته‌بندی.",
};

export default async function PortfolioPage() {
  const projects = await prisma.portfolioProject.findMany({
    orderBy: [{ order: "asc" }, { date: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      technologies: true,
      images: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">نمونه‌کارها</h1>
      <PortfolioFilter projects={projects} />
    </div>
  );
}
