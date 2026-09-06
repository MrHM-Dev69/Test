import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser, canAccessPrefix } from "../../../_lib/guard";
import { Forbidden } from "../../../_components/forbidden";
import { TicketThread } from "./thread";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !canAccessPrefix(admin, ["communication.", "support."])) return <Forbidden label="تیکت‌ها" />;

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { user: true, messages: { orderBy: { createdAt: "asc" }, include: { user: true } } },
  });

  if (!ticket) notFound();

  return <TicketThread ticket={ticket} />;
}
