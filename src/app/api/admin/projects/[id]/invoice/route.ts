import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const project = await prisma.projectRequest.findUnique({ where: { id } });
  if (!project) return jsonError("پروژه یافت نشد", 404);
  if (!project.userId) return jsonError("این درخواست به حساب کاربری متصل نیست.", 400);
  if (!project.quotedPrice) return jsonError("ابتدا قیمت پیشنهادی را ثبت کنید.", 400);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      userId: project.userId,
      projectId: project.id,
      amount: project.quotedPrice,
      status: "ISSUED",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_INVOICE_CREATED",
    entity: "Invoice",
    entityId: invoice.id,
    metadata: { projectId: project.id, amount: Number(invoice.amount) },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, invoice: { ...invoice, amount: Number(invoice.amount) } });
}
