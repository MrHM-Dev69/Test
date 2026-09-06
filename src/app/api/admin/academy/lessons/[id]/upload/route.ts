import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { validateUpload, type UploadCategory } from "@/lib/uploads/validate";
import { storage } from "@/lib/storage";
import { jsonError } from "@/lib/api-helpers";

// Multipart upload for a lesson's video (sets Lesson.contentUrl to the
// private storage key) or a generic attachment (creates a LessonAttachment
// row). Both are written to private storage and only ever served back
// through the enrollment-gated streaming routes.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id: lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return jsonError("درس یافت نشد", 404);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const kind = String(formData?.get("kind") ?? "attachment"); // "video" | "attachment"
  if (!file || !(file instanceof File)) return jsonError("فایلی ارسال نشده است", 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const category: UploadCategory = kind === "video" ? "video" : "document";

  const validation = validateUpload({
    category,
    originalName: file.name,
    sizeBytes: buffer.length,
    buffer,
  });
  if (!validation.ok || !validation.safeFileName) {
    return jsonError(validation.error ?? "فایل نامعتبر است", 400);
  }

  const storageKey = `academy/lessons/${lessonId}/${validation.safeFileName}`;
  await storage.putPrivateFile(storageKey, buffer, file.type || "application/octet-stream");

  if (kind === "video") {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { contentUrl: storageKey, type: "VIDEO" },
    });
    return NextResponse.json({ lesson: updated });
  }

  const attachment = await prisma.lessonAttachment.create({
    data: {
      lessonId,
      fileName: file.name,
      storageKey,
      sizeBytes: BigInt(buffer.length),
    },
  });

  return NextResponse.json({
    attachment: { ...attachment, sizeBytes: attachment.sizeBytes.toString() },
  });
}
