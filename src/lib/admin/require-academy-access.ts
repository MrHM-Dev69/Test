import type { RoleName } from "@prisma/client";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { jsonError } from "@/lib/api-helpers";

export type AcademyAccessResult = { ok: true; user: CurrentUser } | { ok: false; response: Response };

// Shared guard for every admin/academy API route: 401 with no session,
// 403 when the session's role lacks any academy.* management permission.
export async function requireAcademyAccess(): Promise<AcademyAccessResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("احراز هویت الزامی است.", 401) };

  if (!canManageAcademy(user.role as RoleName)) {
    return { ok: false, response: jsonError("شما به این بخش دسترسی ندارید.", 403) };
  }

  return { ok: true, user };
}
