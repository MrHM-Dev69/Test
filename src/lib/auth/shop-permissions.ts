import type { RoleName } from "@prisma/client";
import { hasPermission } from "@/lib/auth/rbac";

// Any of these permission keys grants access to some part of shop admin.
// Individual routes may still perform a finer-grained check (e.g. only
// "shop.orders.write" for order status changes) but this is the baseline
// gate for "can this role even see the shop admin area".
const SHOP_ADMIN_PERMISSION_KEYS = [
  "shop.manage",
  "shop.products.write",
  "shop.orders.write",
  "shop.coupons.write",
  "shop.reviews.moderate",
] as const;

export function canManageShop(role: RoleName): boolean {
  return SHOP_ADMIN_PERMISSION_KEYS.some((key) => hasPermission(role, key));
}
