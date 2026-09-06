import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { PortfolioManager } from "./portfolio-manager";

export default async function PortfolioAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="نمونه‌کارها" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">نمونه‌کارها</h1>
      <PortfolioManager />
    </div>
  );
}
