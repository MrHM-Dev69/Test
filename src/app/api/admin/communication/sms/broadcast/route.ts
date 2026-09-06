import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  body: z.string().trim().min(1).max(280),
  segment: z.enum(["ALL", "CUSTOMER"]),
});

// A hard cap protects the single request/serverless invocation from running
// for an unbounded time — a larger campaign should be paged from the admin
// UI in batches rather than sent in one call.
const MAX_RECIPIENTS = 300;
const SEND_DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const where = {
    phone: { not: null },
    ...(parsed.data.segment === "CUSTOMER" ? { role: { name: "CUSTOMER" as const } } : {}),
  };

  const targets = await prisma.user.findMany({ where, select: { phone: true }, take: MAX_RECIPIENTS });
  const phones = targets.map((t) => t.phone).filter((p): p is string => Boolean(p));

  let sent = 0;
  let failed = 0;
  // Sent sequentially (with a small delay) rather than in parallel, so the
  // real SMS provider's own rate limits are respected instead of firing a
  // burst of concurrent requests at it.
  for (const phone of phones) {
    const result = await sendSms({ toPhone: phone, body: parsed.data.body, templateKey: "admin_broadcast" });
    if (result.ok) sent += 1;
    else failed += 1;
    await sleep(SEND_DELAY_MS);
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "SMS_BROADCAST",
    entity: "SmsLog",
    metadata: { segment: parsed.data.segment, sent, failed },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, sent, failed });
}
