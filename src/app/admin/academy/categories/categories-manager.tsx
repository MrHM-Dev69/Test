"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Category, ProductDomain } from "@prisma/client";

const DOMAIN_LABELS: Record<ProductDomain, string> = {
  WEB: "وب",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  GENERAL: "عمومی",
};

export function CategoriesManager({
  categories,
}: {
  categories: (Category & { _count: { courses: number; products: number } })[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", domain: "GENERAL" as ProductDomain });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await csrfFetch("/api/admin/academy/categories", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "خطا در ایجاد دسته‌بندی");
      return;
    }
    setForm({ name: "", slug: "", domain: "GENERAL" });
    router.refresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm("این دسته‌بندی حذف شود؟")) return;
    setBusy(true);
    const res = await csrfFetch(`/api/admin/academy/categories/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) alert(data?.error ?? "خطا در حذف");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نام</th>
                <th className="p-3 font-medium">اسلاگ</th>
                <th className="p-3 font-medium">حوزه</th>
                <th className="p-3 font-medium">دوره‌ها</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="p-3 text-foreground">{c.name}</td>
                  <td className="p-3 text-muted">{c.slug}</td>
                  <td className="p-3 text-muted">{DOMAIN_LABELS[c.domain]}</td>
                  <td className="p-3 text-muted">{c._count.courses}</td>
                  <td className="p-3">
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteCategory(c.id)}>
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    دسته‌بندی‌ای ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <form onSubmit={addCategory} className="glass-surface flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="text-sm text-muted">نام</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="text-sm text-muted">اسلاگ</label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
        </div>
        <div>
          <label className="text-sm text-muted">حوزه</label>
          <select
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
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
        <Button type="submit" disabled={busy}>
          افزودن
        </Button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
