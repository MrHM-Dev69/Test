import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { ensureCsrfCookie } from "@/lib/security/csrf";
import { getAdminUser, canAccessPrefix } from "./_lib/guard";
import { ADMIN_NAV } from "./_components/nav-data";
import { AdminSidebar } from "./_components/sidebar";

const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "مدیر ارشد",
  ADMIN: "مدیر",
  MANAGER: "مدیر عملیات",
  SHOP_MANAGER: "مدیر فروشگاه",
  ACADEMY_MANAGER: "مدیر آکادمی",
  ACCOUNTANT: "حسابدار",
  SUPPORT: "پشتیبانی",
  EDITOR: "ویرایشگر",
  CUSTOMER: "مشتری",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/login");

  await ensureCsrfCookie();

  const visibleGroups = ADMIN_NAV.filter(
    (g) => !g.permissionPrefixes || canAccessPrefix(user, g.permissionPrefixes),
  ).map((g) => ({
    ...g,
    items: g.items?.filter(() => true),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar
        groups={visibleGroups}
        userName={user.name ?? user.email ?? user.phone ?? "کاربر"}
        userRole={ROLE_LABELS[user.role as RoleName] ?? user.role}
      />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
