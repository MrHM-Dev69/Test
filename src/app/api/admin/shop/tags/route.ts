import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }] },
  });
  if (existing) return jsonError("این برچسب قبلاً وجود دارد", 409);

  const tag = await prisma.tag.create({ data: parsed.data });
  return NextResponse.json({ tag }, { status: 201 });
}
