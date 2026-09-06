import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestMeta } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";
import { storage } from "@/lib/storage";
import { validateUpload, type UploadCategory } from "@/lib/uploads/validate";
import { projectRequestSchema } from "@/lib/validation/project-request";

const EXT_CATEGORY: Record<string, UploadCategory> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  gif: "image",
  svg: "image",
  pdf: "document",
  doc: "document",
  docx: "document",
  txt: "document",
  md: "document",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
};

const MAX_ATTACHMENTS = 5;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const { ipAddress } = await getRequestMeta();

  const rl = checkRateLimit(
    `project-request:${ipAddress ?? "unknown"}`,
    RATE_LIMITS.contactForm.limit,
    RATE_LIMITS.contactForm.windowSeconds,
  );
  if (!rl.allowed) {
    return jsonError(`تعداد درخواست‌ها بیش از حد مجاز است. ${rl.retryAfterSeconds} ثانیه صبر کنید.`, 429);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("درخواست نامعتبر است", 400);

  const fields = {
    contactName: String(form.get("contactName") ?? ""),
    contactEmail: String(form.get("contactEmail") ?? ""),
    contactPhone: String(form.get("contactPhone") ?? ""),
    projectType: String(form.get("projectType") ?? ""),
    categoryDomain: String(form.get("categoryDomain") ?? ""),
    description: String(form.get("description") ?? ""),
    requirements: String(form.get("requirements") ?? ""),
    budgetRange: String(form.get("budgetRange") ?? ""),
    deadline: String(form.get("deadline") ?? ""),
    priority: String(form.get("priority") ?? ""),
  };

  const parsed = projectRequestSchema.safeParse(fields);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const files = form.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_ATTACHMENTS) {
    return jsonError(`حداکثر ${MAX_ATTACHMENTS} فایل پیوست مجاز است.`, 400);
  }

  const storedKeys: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const category = EXT_CATEGORY[ext];
    if (!category) return jsonError(`پسوند فایل «${file.name}» مجاز نیست.`, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = validateUpload({ category, originalName: file.name, sizeBytes: buffer.length, buffer });
    if (!result.ok || !result.safeFileName) return jsonError(result.error ?? "فایل نامعتبر است", 400);

    const key = `project-requests/${crypto.randomUUID()}/${result.safeFileName}`;
    await storage.putPrivateFile(key, buffer, file.type || "application/octet-stream");
    storedKeys.push(key);
  }

  const currentUser = await getCurrentUser();

  const project = await prisma.projectRequest.create({
    data: {
      userId: currentUser?.id,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      projectType: parsed.data.projectType,
      categoryDomain: parsed.data.categoryDomain,
      description: parsed.data.description,
      requirements: parsed.data.requirements,
      budgetRange: parsed.data.budgetRange,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      priority: parsed.data.priority,
      status: "NEW",
      attachments: storedKeys,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { name: { in: ["SUPER_ADMIN", "ADMIN"] } }, isActive: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        channel: "IN_APP" as const,
        title: "درخواست پروژه جدید",
        body: `${parsed.data.contactName} یک درخواست توسعه سفارشی جدید ثبت کرد.`,
        link: `/admin/projects/${project.id}`,
      })),
    });
  }

  await sendEmail({
    toEmail: parsed.data.contactEmail,
    subject: "درخواست پروژه شما ثبت شد",
    html: `
      <div style="font-family: sans-serif; direction: rtl;">
        <h2>درخواست شما ثبت شد</h2>
        <p>سلام ${escapeHtml(parsed.data.contactName)}، درخواست پروژه توسعه سفارشی شما با موفقیت ثبت شد و به‌زودی توسط تیم ما بررسی خواهد شد.</p>
        <p><strong>شماره پیگیری:</strong> ${project.id}</p>
      </div>
    `,
    templateKey: "project_request_confirmation",
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, id: project.id }, { status: 201 });
}
