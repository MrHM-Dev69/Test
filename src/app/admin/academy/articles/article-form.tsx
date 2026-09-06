"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Article, ContentType, ProductDomain } from "@prisma/client";

const TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "مقاله",
  TUTORIAL: "آموزش",
  ROADMAP: "نقشه‌راه",
  RESOURCE: "منبع",
};

const DOMAIN_LABELS: Record<ProductDomain, string> = {
  WEB: "وب",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  GENERAL: "عمومی",
};

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    type: article?.type ?? "ARTICLE",
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    coverImage: article?.coverImage ?? "",
    domain: article?.domain ?? "GENERAL",
    authorName: article?.authorName ?? "",
    isPublished: article?.isPublished ?? false,
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = article ? `/api/admin/academy/articles/${article.id}` : "/api/admin/academy/articles";
    const method = article ? "PATCH" : "POST";
    const res = await csrfFetch(url, { method, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "خطایی رخ داد");
      return;
    }

    if (!article) {
      router.push(`/admin/academy/articles/${data.article.id}/edit`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>نوع محتوا</Label>
          <select
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentType }))}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
      <div>
        <Label>عنوان</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <Label>اسلاگ</Label>
        <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
      </div>
      <div>
        <Label>خلاصه</Label>
        <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
      </div>
      <div>
        <Label>متن کامل</Label>
        <Textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          required
          rows={10}
        />
      </div>
      <div>
        <Label>تصویر کاور (آدرس)</Label>
        <Input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} />
      </div>
      <div>
        <Label>نویسنده</Label>
        <Input value={form.authorName} onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>عنوان سئو</Label>
          <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
        </div>
        <div>
          <Label>توضیحات سئو</Label>
          <Input
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
        />
        منتشر شده
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "در حال ذخیره..." : article ? "ذخیره تغییرات" : "ایجاد محتوا"}
      </Button>
    </form>
  );
}
