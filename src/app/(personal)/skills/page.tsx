import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "مهارت‌ها",
  description: "فهرست کامل مهارت‌های فنی به تفکیک دسته‌بندی.",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  EXPERT: "متخصص",
};

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }] });

  const grouped = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const key = skill.category ?? "سایر";
    acc[key] = acc[key] ? [...acc[key], skill] : [skill];
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">مهارت‌ها</h1>
      {categories.length === 0 ? (
        <p className="text-muted">هنوز مهارتی ثبت نشده است.</p>
      ) : (
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-4 text-xl font-semibold text-accent">{category}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {grouped[category].map((skill) => (
                  <Card key={skill.id} className="p-4 text-center">
                    <p className="font-medium">{skill.name}</p>
                    <Badge variant="secondary" className="mt-2">
                      {LEVEL_LABELS[skill.level] ?? skill.level}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
