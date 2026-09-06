import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const createSchema = z.object({ title: z.string().min(1).max(200), dueDate: z.string().datetime().optional() });
const patchSchema = z.object({ milestoneId: z.string().min(1), isCompleted: z.boolean() });

async function authorize() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return null;
  return admin;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize();
  if (!admin) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const project = await prisma.projectRequest.findUnique({ where: { id } });
  if (!project) return jsonError("پروژه یافت نشد", 404);

  const count = await prisma.milestone.count({ where: { projectId: id } });
  const milestone = await prisma.milestone.create({
    data: {
      projectId: id,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      order: count,
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_MILESTONE_CREATED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { milestoneId: milestone.id, title: milestone.title },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, milestone });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize();
  if (!admin) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const milestone = await prisma.milestone.findFirst({ where: { id: parsed.data.milestoneId, projectId: id } });
  if (!milestone) return jsonError("نقطه عطف یافت نشد", 404);

  await prisma.milestone.update({ where: { id: milestone.id }, data: { isCompleted: parsed.data.isCompleted } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_MILESTONE_UPDATED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { milestoneId: milestone.id, isCompleted: parsed.data.isCompleted },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize();
  if (!admin) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const milestoneId = req.nextUrl.searchParams.get("milestoneId");
  if (!milestoneId) return jsonError("شناسه نامعتبر است", 400);

  const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, projectId: id } });
  if (!milestone) return jsonError("نقطه عطف یافت نشد", 404);

  await prisma.milestone.delete({ where: { id: milestone.id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_MILESTONE_DELETED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { milestoneId },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
