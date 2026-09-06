import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "تحصیلات",
  description: "تایم‌لاین کامل تحصیلات دانشگاهی.",
};

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function EducationPage() {
  const items = await prisma.educationItem.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">تحصیلات</h1>
      {items.length === 0 ? (
        <p className="text-muted">موردی ثبت نشده است.</p>
      ) : (
        <ol className="relative border-r-2 border-border pr-6">
          {items.map((item) => (
            <li key={item.id} className="mb-10">
              <span className="absolute -right-[9px] mt-1.5 h-4 w-4 rounded-full bg-accent glow-accent" />
              <p className="text-sm text-muted">
                {formatFa(item.startDate)} — {item.isCurrent ? "در حال تحصیل" : item.endDate ? formatFa(item.endDate) : ""}
              </p>
              <h3 className="text-lg font-semibold">{item.degree}</h3>
              <p className="text-accent">
                {item.institution}
                {item.fieldOfStudy ? ` — ${item.fieldOfStudy}` : ""}
              </p>
              {item.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">{item.description}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
