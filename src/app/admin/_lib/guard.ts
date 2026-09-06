import "server-only";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { hasPermission, ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import type { RoleName } from "@prisma/client";

// Roles that may enter the admin shell at all. Fine-grained section access
// is then gated per-page via hasPermission().
export const ADMIN_ROLES: RoleName[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SHOP_MANAGER",
  "ACADEMY_MANAGER",
  "ACCOUNTANT",
  "SUPPORT",
  "EDITOR",
];

export function isAdminRole(role: string): role is RoleName {
  return (ADMIN_ROLES as string[]).includes(role);
}

/** Returns the current user if it may access the admin shell, else null. */
export async function getAdminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!isAdminRole(user.role)) return null;
  return user;
}

/** Fine-grained permission check for a page/section within the admin shell. */
export function can(user: CurrentUser, permission: string): boolean {
  return hasPermission(user.role as RoleName, permission);
}

/** True if the role holds "*" or any permission key under the given dot-prefix
 * (e.g. "shop." matches "shop.manage" as well as "shop.products.write"). Used
 * to decide whether a nav group/section is reachable by a scoped role like
 * SHOP_MANAGER, which never holds the coarse "shop.manage" key. */
export function canAccessPrefix(user: CurrentUser, prefixes: string | string[]): boolean {
  const perms = ROLE_PERMISSIONS[user.role as RoleName] ?? [];
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  return perms.some((p) => p === "*" || list.some((prefix) => p.startsWith(prefix)));
}
