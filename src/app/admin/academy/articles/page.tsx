import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentType, RoleName } from "@prisma/client";

export const metadata = { title: "مقالات و آموزش‌ها" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "مقاله",
  TUTORIAL: "آموزش",
  ROADMAP: "نقشه‌راه",
  RESOURCE: "منبع",
};

export default async function AdminArticlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="مقالات" />;

  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">مقالات، آموزش‌ها، نقشه‌راه‌ها و منابع</h1>
        <Link href="/admin/academy/articles/new" className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
          افزودن محتوا
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">عنوان</th>
                <th className="p-3 font-medium">نوع</th>
                <th className="p-3 font-medium">بازدید</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    محتوایی ثبت نشده است.
                  </td>
                </tr>
              )}
              {articles.map((a) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="p-3 text-foreground">{a.title}</td>
                  <td className="p-3 text-muted">{TYPE_LABELS[a.type]}</td>
                  <td className="p-3 text-muted">{a.viewCount}</td>
                  <td className="p-3">
                    <Badge variant={a.isPublished ? "success" : "secondary"}>
                      {a.isPublished ? "منتشر شده" : "پیش‌نویس"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/academy/articles/${a.id}/edit`} className="text-accent hover:underline">
                      ویرایش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
