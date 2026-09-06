import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const createSchema = z.object({ title: z.string().min(1).max(200) });
const patchSchema = z.object({ taskId: z.string().min(1), isCompleted: z.boolean() });

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

  const count = await prisma.projectTask.count({ where: { projectId: id } });
  const task = await prisma.projectTask.create({ data: { projectId: id, title: parsed.data.title, order: count } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_TASK_CREATED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { taskId: task.id, title: task.title },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize();
  if (!admin) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const task = await prisma.projectTask.findFirst({ where: { id: parsed.data.taskId, projectId: id } });
  if (!task) return jsonError("وظیفه یافت نشد", 404);

  await prisma.projectTask.update({ where: { id: task.id }, data: { isCompleted: parsed.data.isCompleted } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_TASK_UPDATED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { taskId: task.id, isCompleted: parsed.data.isCompleted },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize();
  if (!admin) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return jsonError("شناسه نامعتبر است", 400);

  const task = await prisma.projectTask.findFirst({ where: { id: taskId, projectId: id } });
  if (!task) return jsonError("وظیفه یافت نشد", 404);

  await prisma.projectTask.delete({ where: { id: task.id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_TASK_DELETED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { taskId },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
