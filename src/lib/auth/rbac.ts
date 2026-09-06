import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Static role → permission-key map, seeded into the DB (Role/Permission/
// RolePermission tables) so an admin can still audit/extend it at runtime,
// but checked here against a frozen in-memory table for zero extra queries
// on the hot path. Every server-side mutation must go through hasPermission
// or requirePermission — never trust a role check performed only in the UI.
export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "personal.manage",
    "shop.manage",
    "academy.manage",
    "customers.manage",
    "projects.manage",
    "marketing.manage",
    "communication.manage",
    "analytics.view",
    "settings.manage",
    "accounting.manage",
    "security.manage",
  ],
  MANAGER: ["shop.manage", "academy.manage", "customers.manage", "analytics.view"],
  SHOP_MANAGER: [
    "shop.products.write",
    "shop.orders.write",
    "shop.coupons.write",
    "shop.reviews.moderate",
    "analytics.view",
  ],
  ACADEMY_MANAGER: [
    "academy.courses.write",
    "academy.students.manage",
    "academy.reviews.moderate",
    "analytics.view",
  ],
  ACCOUNTANT: ["accounting.manage", "analytics.view"],
  SUPPORT: ["support.tickets.manage", "customers.view"],
  EDITOR: ["personal.manage", "cms.manage"],
  CUSTOMER: ["self.manage"],
};

export function hasPermission(role: RoleName, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
  }
}

export function assertPermission(role: RoleName, permission: string) {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Role ${role} lacks permission ${permission}`);
  }
}

// Seeds Role rows if missing; used by the seed script and safe to re-run.
export async function ensureRolesExist() {
  const labels: Record<RoleName, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Manager",
    SHOP_MANAGER: "Shop Manager",
    ACADEMY_MANAGER: "Academy Manager",
    ACCOUNTANT: "Accountant",
    SUPPORT: "Support",
    EDITOR: "Editor",
    CUSTOMER: "Customer",
  };

  for (const name of Object.keys(labels) as RoleName[]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, label: labels[name] },
    });
  }
}
