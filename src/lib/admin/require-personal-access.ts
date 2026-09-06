import type { RoleName } from "@prisma/client";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { assertPermission, ForbiddenError } from "@/lib/auth/rbac";
import { jsonError } from "@/lib/api-helpers";

export type PersonalAccessResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; response: Response };

// Shared guard for every admin/personal API route: 401 with no session,
// 403 when the session's role lacks the "personal.manage" permission.
export async function requirePersonalAccess(): Promise<PersonalAccessResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("احراز هویت الزامی است.", 401) };

  try {
    assertPermission(user.role as RoleName, "personal.manage");
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return { ok: false, response: jsonError("شما به این بخش دسترسی ندارید.", 403) };
    }
    throw err;
  }

  return { ok: true, user };
}
