import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const ROLE_VALUES: [RoleName, ...RoleName[]] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SHOP_MANAGER",
  "ACADEMY_MANAGER",
  "ACCOUNTANT",
  "SUPPORT",
  "EDITOR",
  "CUSTOMER",
];

const schema = z.object({ role: z.enum(ROLE_VALUES) });

// Changing a user's role is a privileged, sensitive action — only ADMIN/
// SUPER_ADMIN-level "customers.manage" holders may call this, and every
// change is audited.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "customers.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) return jsonError("کاربر یافت نشد", 404);

  const newRole = await prisma.role.findUnique({ where: { name: parsed.data.role } });
  if (!newRole) return jsonError("نقش نامعتبر است", 400);

  await prisma.user.update({ where: { id }, data: { roleId: newRole.id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "CUSTOMER_ROLE_CHANGED",
    entity: "User",
    entityId: id,
    metadata: { from: target.role.name, to: parsed.data.role },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
