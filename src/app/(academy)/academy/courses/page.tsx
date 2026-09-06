import Link from "next/link";
import type { Metadata } from "next";
import { getCourseCatalog, getCourseCategories, type CourseSort } from "@/lib/academy/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";
import type { CourseLevel, ProductDomain } from "@prisma/client";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "فهرست دوره‌های آموزشی آکادمی با امکان فیلتر بر اساس دسته‌بندی، سطح و قیمت.",
};

interface SearchParams {
  category?: string;
  domain?: string;
  level?: string;
  pricing?: string;
  q?: string;
  sort?: string;
  page?: string;
}

const SORT_OPTIONS: { value: CourseSort; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "rating", label: "بالاترین امتیاز" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
];

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

const DOMAIN_LABELS: Record<ProductDomain, string> = {
  WEB: "وب",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  GENERAL: "عمومی",
};

export default async function CoursesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const [{ items, total, totalPages }, categories] = await Promise.all([
    getCourseCatalog({
      categorySlug: sp.category,
      domain: sp.domain as ProductDomain | undefined,
      level: sp.level as CourseLevel | undefined,
      pricing: sp.pricing as "free" | "paid" | undefined,
      q: sp.q,
      sort: sp.sort as CourseSort | undefined,
      page,
    }),
    getCourseCategories(),
  ]);

  function buildHref(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/academy/courses?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">دوره‌های آکادمی</h1>

      <form className="glass-surface flex flex-wrap gap-3 p-4" action="/academy/courses">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="جستجوی دوره..."
          className="h-10 min-w-[200px] flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted"
        />
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="level"
          defaultValue={sp.level ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">همه سطوح</option>
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="pricing"
          defaultValue={sp.pricing ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">رایگان و پولی</option>
          <option value="free">رایگان</option>
          <option value="paid">پولی</option>
        </select>
        <select
          name="sort"
          defaultValue={sp.sort ?? "newest"}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          اعمال فیلتر
        </button>
      </form>

      <p className="text-sm text-muted">{total} دوره یافت شد</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((course) => (
          <Link key={course.id} href={`/academy/courses/${course.slug}`}>
            <Card className="h-full transition-transform hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{DOMAIN_LABELS[course.domain]}</Badge>
                  <Badge variant="secondary">{LEVEL_LABELS[course.level]}</Badge>
                </div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant={course.isFree ? "success" : "default"}>
                  {course.isFree ? "رایگان" : formatToman(Number(course.salePrice ?? course.price))}
                </Badge>
                <span className="text-xs text-muted">{course.studentCount} دانشجو</span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {items.length === 0 && <p className="text-muted">دوره‌ای با این فیلترها یافت نشد.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ page: String(p) })}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                p === page ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
