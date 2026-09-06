import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { QuestionsList } from "./questions-list";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "پرسش و پاسخ" };
export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="پرسش و پاسخ" />;

  const questions = await prisma.courseQuestion.findMany({
    orderBy: [{ answer: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    include: { course: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">پرسش و پاسخ دوره‌ها</h1>
      <QuestionsList questions={questions} />
    </div>
  );
}
