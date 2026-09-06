import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleForm } from "../article-form";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "افزودن محتوا" };

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="مقالات" />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">افزودن محتوا</h1>
      <Card>
        <CardContent className="pt-6">
          <ArticleForm />
        </CardContent>
      </Card>
    </div>
  );
}
