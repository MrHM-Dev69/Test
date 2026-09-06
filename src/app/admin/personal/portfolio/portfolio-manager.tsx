"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  technologies: string[];
  images: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  features: string[];
  isFeatured: boolean;
  date: string;
  order: number;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  category: string;
  technologies: string;
  images: string;
  liveUrl: string;
  repoUrl: string;
  features: string;
  isFeatured: boolean;
  date: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  category: "",
  technologies: "",
  images: "",
  liveUrl: "",
  repoUrl: "",
  features: "",
  isFeatured: false,
  date: new Date().toISOString().slice(0, 10),
  order: "0",
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toCsv(list: string[]): string {
  return list.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function PortfolioManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/portfolio");
    const data = await res.json();
    setItems(data.projects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: PortfolioProject) {
    setEditingId(item.id);
    setSlugTouched(true);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      category: item.category ?? "",
      technologies: toCsv(item.technologies),
      images: toCsv(item.images),
      liveUrl: item.liveUrl ?? "",
      repoUrl: item.repoUrl ?? "",
      features: toCsv(item.features),
      isFeatured: item.isFeatured,
      date: item.date.slice(0, 10),
      order: item.order.toString(),
    });
  }

  function resetForm() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        category: form.category,
        technologies: fromCsv(form.technologies),
        images: fromCsv(form.images),
        liveUrl: form.liveUrl,
        repoUrl: form.repoUrl,
        features: fromCsv(form.features),
        isFeatured: form.isFeatured,
        date: form.date,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/portfolio/${editingId}` : "/api/admin/personal/portfolio";
      const res = await csrfFetch(url, { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره ناموفق بود", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: editingId ? "به‌روزرسانی شد" : "افزوده شد", variant: "success" });
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این نمونه‌کار مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/portfolio/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: "حذف ناموفق بود", description: data.error, variant: "destructive" });
      return;
    }
    toast({ title: "حذف شد", variant: "success" });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-semibold">{editingId ? "ویرایش نمونه‌کار" : "افزودن نمونه‌کار"}</h2>
          <div>
            <Label htmlFor="pf-title">عنوان</Label>
            <Input
              id="pf-title"
              className="mt-1.5"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((p) => ({ ...p, title, slug: slugTouched ? p.slug : slugify(title) }));
              }}
              required
            />
          </div>
          <div>
            <Label htmlFor="pf-slug">نامک (Slug)</Label>
            <Input
              id="pf-slug"
              dir="ltr"
              className="mt-1.5"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              required
            />
          </div>
          <div>
            <Label htmlFor="pf-desc">توضیحات</Label>
            <Textarea id="pf-desc" className="mt-1.5" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="pf-category">دسته‌بندی</Label>
            <Input id="pf-category" className="mt-1.5" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="pf-tech">تکنولوژی‌ها (با کاما جدا کنید)</Label>
            <Input id="pf-tech" dir="ltr" className="mt-1.5" value={form.technologies} onChange={(e) => setForm((p) => ({ ...p, technologies: e.target.value }))} placeholder="Next.js, TypeScript" />
          </div>
          <div>
            <Label htmlFor="pf-images">آدرس تصاویر (با کاما جدا کنید)</Label>
            <Textarea id="pf-images" dir="ltr" className="mt-1.5" rows={2} value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="pf-features">امکانات (با کاما جدا کنید)</Label>
            <Textarea id="pf-features" className="mt-1.5" rows={2} value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pf-live">آدرس نسخه زنده</Label>
              <Input id="pf-live" dir="ltr" className="mt-1.5" value={form.liveUrl} onChange={(e) => setForm((p) => ({ ...p, liveUrl: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="pf-repo">آدرس مخزن کد</Label>
              <Input id="pf-repo" dir="ltr" className="mt-1.5" value={form.repoUrl} onChange={(e) => setForm((p) => ({ ...p, repoUrl: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pf-date">تاریخ</Label>
              <Input id="pf-date" type="date" className="mt-1.5" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="pf-order">ترتیب</Label>
              <Input id="pf-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
            نمونه‌کار ویژه
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ذخیره..." : editingId ? "به‌روزرسانی" : "افزودن"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                انصراف
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {loading ? (
          <p className="text-muted">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">هنوز نمونه‌کاری ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {item.isFeatured && <Badge>ویژه</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted" dir="ltr">
                  /portfolio/{item.slug}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>
                  ویرایش
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                  حذف
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
