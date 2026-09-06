import type { RoleName } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { TestimonialsManager } from "./testimonials-manager";

export default async function TestimonialsAdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role as RoleName, "personal.manage")) {
    return <Forbidden label="نظرات مشتریان" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">نظرات مشتریان</h1>
      <TestimonialsManager />
    </div>
  );
}
