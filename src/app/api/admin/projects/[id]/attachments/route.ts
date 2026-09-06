import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

// Streams a private project-request attachment to an authorized admin only
// — attachments are never served from a public path.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return jsonError("کلید فایل نامعتبر است", 400);

  const project = await prisma.projectRequest.findUnique({ where: { id } });
  if (!project || !project.attachments.includes(key)) return jsonError("فایل یافت نشد", 404);

  const buffer = await storage.getPrivateFile(key).catch(() => null);
  if (!buffer) return jsonError("فایل یافت نشد", 404);

  const fileName = key.split("/").pop() ?? "attachment";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
