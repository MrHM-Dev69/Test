import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { CertificatesManager } from "./certificates-manager";

export default async function CertificatesAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="گواهینامه‌ها" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">گواهینامه‌ها</h1>
      <CertificatesManager />
    </div>
  );
}
