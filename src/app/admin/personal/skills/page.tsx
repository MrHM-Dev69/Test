import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { SkillsManager } from "./skills-manager";

export default async function SkillsAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="مهارت‌ها" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">مهارت‌ها</h1>
      <SkillsManager />
    </div>
  );
}
