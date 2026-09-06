import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { ProjectWorkspace } from "./workspace";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return <Forbidden label="پروژه‌ها" />;

  const { id } = await params;
  const project = await prisma.projectRequest.findUnique({
    where: { id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      tasks: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      user: true,
    },
  });

  if (!project) notFound();

  // Prisma Decimal instances aren't a plain serializable value across the
  // server/client component boundary — convert to number before handing off.
  const serialized = {
    ...project,
    quotedPrice: project.quotedPrice ? Number(project.quotedPrice) : null,
    invoices: project.invoices.map((inv) => ({ ...inv, amount: Number(inv.amount) })),
  };

  return <ProjectWorkspace project={serialized} />;
}
