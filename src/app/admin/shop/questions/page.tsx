import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { QuestionAnswerForm } from "@/components/admin/shop/question-answer";

export const metadata = { title: "پرسش و پاسخ فروشگاه" };

export default async function AdminQuestionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="پرسش و پاسخ" />;

  const questions = await prisma.question.findMany({
    where: { answeredAt: null },
    include: { product: { select: { title: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">پرسش‌های بی‌پاسخ</h1>
      {questions.length === 0 ? (
        <p className="text-muted">پرسش بی‌پاسخی وجود ندارد.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <QuestionAnswerForm
              key={q.id}
              q={{
                id: q.id,
                question: q.question,
                answer: q.answer,
                productTitle: q.product.title,
                userName: q.user.name ?? q.user.email ?? "کاربر",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
