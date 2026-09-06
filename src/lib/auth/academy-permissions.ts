import type { RoleName } from "@prisma/client";
import { hasPermission } from "@/lib/auth/rbac";

// Any of these permission keys grants access to the Academy admin area.
// ADMIN carries "academy.manage" (see ROLE_PERMISSIONS); ACADEMY_MANAGER
// carries the narrower academy.* keys.
const ACADEMY_ADMIN_PERMISSIONS = [
  "academy.manage",
  "academy.courses.write",
  "academy.students.manage",
  "academy.reviews.moderate",
] as const;

export function canManageAcademy(role: RoleName): boolean {
  return ACADEMY_ADMIN_PERMISSIONS.some((perm) => hasPermission(role, perm));
}
