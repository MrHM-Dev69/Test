import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { userCanAccessLesson } from "@/lib/academy/access";
import { storage } from "@/lib/storage";
import { jsonError } from "@/lib/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id: lessonId, attachmentId } = await params;
  const user = await getCurrentUser();

  const allowed = await userCanAccessLesson(user?.id ?? null, lessonId);
  if (!allowed) return jsonError("دسترسی مجاز نیست", 403);

  const attachment = await prisma.lessonAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.lessonId !== lessonId) return jsonError("فایل یافت نشد", 404);

  try {
    const buffer = await storage.getPrivateFile(attachment.storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
      },
    });
  } catch {
    return jsonError("خطا در بارگذاری فایل", 500);
  }
}
