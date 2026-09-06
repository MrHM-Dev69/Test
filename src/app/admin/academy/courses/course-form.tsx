"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Category, Course, CourseLevel, ProductDomain } from "@prisma/client";

const DOMAIN_LABELS: Record<ProductDomain, string> = {
  WEB: "وب",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  GENERAL: "عمومی",
};

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

export function CourseForm({ course, categories }: { course?: Course; categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: course?.title ?? "",
    slug: course?.slug ?? "",
    description: course?.description ?? "",
    coverImage: course?.coverImage ?? "",
    categoryId: course?.categoryId ?? categories[0]?.id ?? "",
    domain: course?.domain ?? "GENERAL",
    level: course?.level ?? "BEGINNER",
    durationMinutes: course?.durationMinutes ?? 0,
    requirements: course?.requirements ?? "",
    isFree: course?.isFree ?? true,
    price: Number(course?.price ?? 0),
    salePrice: course?.salePrice ? Number(course.salePrice) : undefined,
    isPublished: course?.isPublished ?? false,
    isFeatured: course?.isFeatured ?? false,
    sourceCodeUrl: course?.sourceCodeUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = course ? `/api/admin/academy/courses/${course.id}` : "/api/admin/academy/courses";
    const method = course ? "PATCH" : "POST";
    const res = await csrfFetch(url, { method, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "خطایی رخ داد");
      return;
    }

    if (!course) {
      router.push(`/admin/academy/courses/${data.course.id}/edit`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>عنوان دوره</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <Label>اسلاگ (slug)</Label>
        <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
      </div>
      <div>
        <Label>توضیحات</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          rows={5}
        />
      </div>
      <div>
        <Label>تصویر کاور (آدرس)</Label>
        <Input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>دسته‌بندی</Label>
          <select
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>حوزه</Label>
          <select
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value as ProductDomain }))}
          >
            {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>سطح</Label>
          <select
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as CourseLevel }))}
          >
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>مدت زمان (دقیقه)</Label>
          <Input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div>
        <Label>پیش‌نیازها</Label>
        <Textarea
          value={form.requirements}
          onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
        />
      </div>
      <div>
        <Label>لینک سورس کد (اختیاری)</Label>
        <Input value={form.sourceCodeUrl} onChange={(e) => setForm((f) => ({ ...f, sourceCodeUrl: e.target.value }))} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isFree"
          checked={form.isFree}
          onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
        />
        <Label htmlFor="isFree">دوره رایگان است</Label>
      </div>

      {!form.isFree && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>قیمت (تومان)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label>قیمت با تخفیف (اختیاری)</Label>
            <Input
              type="number"
              value={form.salePrice ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, salePrice: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          منتشر شده
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          دوره ویژه
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "در حال ذخیره..." : course ? "ذخیره تغییرات" : "ایجاد دوره"}
      </Button>
    </form>
  );
}
