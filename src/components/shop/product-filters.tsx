import { ProductDomain } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DOMAIN_LABELS: Record<ProductDomain, string> = {
  WEB: "وب",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  GENERAL: "عمومی",
};

export async function ProductFilters({
  basePath,
  current,
}: {
  basePath: string;
  current: Record<string, string | undefined>;
}) {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <form method="get" action={basePath} className="glass-surface flex flex-wrap items-end gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">دسته‌بندی</label>
        <select
          name="category"
          defaultValue={current.category ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">همه</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">حوزه</label>
        <select
          name="domain"
          defaultValue={current.domain ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">همه</option>
          {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">نوع</label>
        <select
          name="free"
          defaultValue={current.free ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">همه</option>
          <option value="free">رایگان</option>
          <option value="paid">ویژه</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">حداقل قیمت</label>
        <input
          type="number"
          name="priceMin"
          defaultValue={current.priceMin ?? ""}
          className="h-10 w-28 rounded-lg border border-border bg-surface px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">حداکثر قیمت</label>
        <input
          type="number"
          name="priceMax"
          defaultValue={current.priceMax ?? ""}
          className="h-10 w-28 rounded-lg border border-border bg-surface px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">مرتب‌سازی</label>
        <select
          name="sort"
          defaultValue={current.sort ?? "newest"}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="price_asc">ارزان‌ترین</option>
          <option value="price_desc">گران‌ترین</option>
          <option value="popular">پرفروش‌ترین</option>
          <option value="rating">بیشترین امتیاز</option>
        </select>
      </div>
      <button
        type="submit"
        className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        اعمال فیلتر
      </button>
    </form>
  );
}
