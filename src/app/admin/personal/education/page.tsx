import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { EducationManager } from "./education-manager";

export default async function EducationAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="تحصیلات" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">تحصیلات</h1>
      <EducationManager />
    </div>
  );
}
