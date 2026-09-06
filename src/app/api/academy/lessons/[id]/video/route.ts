import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { userCanAccessLesson } from "@/lib/academy/access";
import { storage } from "@/lib/storage";
import { jsonError } from "@/lib/api-helpers";

// Streams a lesson's video bytes. Never returns them unless the caller is
// enrolled in the owning course (or the lesson is a free preview) — the
// video is otherwise stored under a private, non-web-accessible key.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const user = await getCurrentUser();

  const allowed = await userCanAccessLesson(user?.id ?? null, lessonId);
  if (!allowed) return jsonError("دسترسی مجاز نیست", 403);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { contentUrl: true, type: true },
  });
  if (!lesson || lesson.type !== "VIDEO" || !lesson.contentUrl) {
    return jsonError("ویدیو یافت نشد", 404);
  }

  try {
    const buffer = await storage.getPrivateFile(lesson.contentUrl);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return jsonError("خطا در بارگذاری ویدیو", 500);
  }
}
