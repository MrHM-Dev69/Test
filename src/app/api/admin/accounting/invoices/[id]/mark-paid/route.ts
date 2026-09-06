import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return jsonError("فاکتور یافت نشد", 404);
  if (invoice.status === "PAID") return jsonError("فاکتور قبلاً پرداخت شده است", 400);

  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.transaction.create({
      data: {
        type: "INCOME",
        category: invoice.projectId ? "project_revenue" : "invoice_payment",
        amount: invoice.amount,
        description: `پرداخت فاکتور ${invoice.invoiceNumber}`,
        referenceType: "Invoice",
        referenceId: invoice.id,
      },
    }),
  ]);

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "INVOICE_MARKED_PAID",
    entity: "Invoice",
    entityId: id,
    metadata: { amount: Number(invoice.amount) },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
