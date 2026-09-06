"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";
import { formatToman } from "@/lib/utils";

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  priceFrom: string | null;
  domain: string | null;
  order: number;
  isActive: boolean;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  iconUrl: string;
  priceFrom: string;
  domain: string;
  order: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  iconUrl: "",
  priceFrom: "",
  domain: "",
  order: "0",
  isActive: true,
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ServicesManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/services");
    const data = await res.json();
    setItems(data.services ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  function startEdit(item: Service) {
    setEditingId(item.id);
    setSlugTouched(true);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      iconUrl: item.iconUrl ?? "",
      priceFrom: item.priceFrom ?? "",
      domain: item.domain ?? "",
      order: item.order.toString(),
      isActive: item.isActive,
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
        iconUrl: form.iconUrl,
        priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
        domain: form.domain,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };
      const url = editingId ? `/api/admin/personal/services/${editingId}` : "/api/admin/personal/services";
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
    if (!confirm("آیا از حذف این خدمت مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/services/${id}`, { method: "DELETE" });
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
          <h2 className="font-semibold">{editingId ? "ویرایش خدمت" : "افزودن خدمت"}</h2>
          <div>
            <Label htmlFor="svc-title">عنوان</Label>
            <Input
              id="svc-title"
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
            <Label htmlFor="svc-slug">نامک (Slug)</Label>
            <Input
              id="svc-slug"
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
            <Label htmlFor="svc-desc">توضیحات</Label>
            <Textarea id="svc-desc" className="mt-1.5" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="svc-domain">حوزه</Label>
              <Input id="svc-domain" className="mt-1.5" value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))} placeholder="Web / WordPress / FiveM" />
            </div>
            <div>
              <Label htmlFor="svc-price">شروع قیمت (تومان)</Label>
              <Input id="svc-price" type="number" className="mt-1.5" value={form.priceFrom} onChange={(e) => setForm((p) => ({ ...p, priceFrom: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="svc-icon">آدرس آیکون</Label>
            <Input id="svc-icon" dir="ltr" className="mt-1.5" value={form.iconUrl} onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="svc-order">ترتیب</Label>
            <Input id="svc-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            فعال
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
          <p className="text-muted">هنوز خدمتی ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {!item.isActive && <Badge variant="warning">غیرفعال</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted" dir="ltr">
                  /{item.slug} {item.priceFrom ? `— ${formatToman(Number(item.priceFrom))}` : ""}
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
