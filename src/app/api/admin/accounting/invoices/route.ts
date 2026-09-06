import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  userEmail: z.string().trim().email(),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
});

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.userEmail } });
  if (!user) return jsonError("کاربری با این ایمیل یافت نشد", 404);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      userId: user.id,
      amount: parsed.data.amount,
      status: "ISSUED",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "INVOICE_CREATED_MANUAL",
    entity: "Invoice",
    entityId: invoice.id,
    metadata: { userId: user.id, amount: parsed.data.amount },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, invoice: { ...invoice, amount: Number(invoice.amount) } }, { status: 201 });
}
