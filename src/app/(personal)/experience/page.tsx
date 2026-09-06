import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "سوابق کاری",
  description: "تایم‌لاین کامل سوابق شغلی.",
};

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function ExperiencePage() {
  const experiences = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">سوابق کاری</h1>
      {experiences.length === 0 ? (
        <p className="text-muted">موردی ثبت نشده است.</p>
      ) : (
        <ol className="relative border-r-2 border-border pr-6">
          {experiences.map((exp) => (
            <li key={exp.id} className="mb-10">
              <span className="absolute -right-[9px] mt-1.5 h-4 w-4 rounded-full bg-accent glow-accent" />
              <p className="text-sm text-muted">
                {formatFa(exp.startDate)} — {exp.isCurrent ? "اکنون" : exp.endDate ? formatFa(exp.endDate) : ""}
              </p>
              <h3 className="text-lg font-semibold">{exp.role}</h3>
              <p className="text-accent">
                {exp.company}
                {exp.location ? ` — ${exp.location}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">{exp.description}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
