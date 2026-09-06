import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { ExperienceManager } from "./experience-manager";

export default async function ExperienceAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="سوابق کاری" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">سوابق کاری</h1>
      <ExperienceManager />
    </div>
  );
}
