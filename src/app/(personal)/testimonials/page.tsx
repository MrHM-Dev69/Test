import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "نظرات مشتریان",
  description: "بازخورد و نظرات مشتریان و همکاران.",
};

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">نظرات مشتریان</h1>
      {testimonials.length === 0 ? (
        <p className="text-muted">هنوز نظری ثبت نشده است.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.id}>
              <div className="mb-3 text-accent" aria-label={`امتیاز ${t.rating} از ۵`}>
                {"★".repeat(t.rating)}
                {"☆".repeat(5 - t.rating)}
              </div>
              <p className="text-sm leading-7 text-muted">&ldquo;{t.content}&rdquo;</p>
              <p className="mt-4 font-semibold">{t.authorName}</p>
              {t.authorRole && <p className="text-xs text-muted">{t.authorRole}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
