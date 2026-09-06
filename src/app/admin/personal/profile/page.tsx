import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { ProfileForm } from "./profile-form";

export default async function ProfileAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="پروفایل" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">پروفایل</h1>
      <ProfileForm />
    </div>
  );
}
