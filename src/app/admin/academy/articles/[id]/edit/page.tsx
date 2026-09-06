import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleForm } from "../../article-form";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "ویرایش محتوا" };
export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="مقالات" />;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">ویرایش: {article.title}</h1>
      <Card>
        <CardContent className="pt-6">
          <ArticleForm article={article} />
        </CardContent>
      </Card>
    </div>
  );
}
