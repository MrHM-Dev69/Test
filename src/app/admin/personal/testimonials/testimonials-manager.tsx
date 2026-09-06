"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  avatarUrl: string | null;
  content: string;
  rating: number;
  isFeatured: boolean;
  order: number;
}

interface FormState {
  authorName: string;
  authorRole: string;
  avatarUrl: string;
  content: string;
  rating: string;
  isFeatured: boolean;
  order: string;
}

const EMPTY_FORM: FormState = {
  authorName: "",
  authorRole: "",
  avatarUrl: "",
  content: "",
  rating: "5",
  isFeatured: false,
  order: "0",
};

export function TestimonialsManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/testimonials");
    const data = await res.json();
    setItems(data.testimonials ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      authorName: item.authorName,
      authorRole: item.authorRole ?? "",
      avatarUrl: item.avatarUrl ?? "",
      content: item.content,
      rating: item.rating.toString(),
      isFeatured: item.isFeatured,
      order: item.order.toString(),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        authorName: form.authorName,
        authorRole: form.authorRole,
        avatarUrl: form.avatarUrl,
        content: form.content,
        rating: Number(form.rating) || 5,
        isFeatured: form.isFeatured,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/testimonials/${editingId}` : "/api/admin/personal/testimonials";
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
    if (!confirm("آیا از حذف این نظر مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/testimonials/${id}`, { method: "DELETE" });
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
          <h2 className="font-semibold">{editingId ? "ویرایش نظر" : "افزودن نظر"}</h2>
          <div>
            <Label htmlFor="tm-name">نام</Label>
            <Input id="tm-name" className="mt-1.5" value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="tm-role">سمت / نقش</Label>
            <Input id="tm-role" className="mt-1.5" value={form.authorRole} onChange={(e) => setForm((p) => ({ ...p, authorRole: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="tm-avatar">آدرس تصویر</Label>
            <Input id="tm-avatar" dir="ltr" className="mt-1.5" value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="tm-content">متن نظر</Label>
            <Textarea id="tm-content" className="mt-1.5" rows={4} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tm-rating">امتیاز (۱ تا ۵)</Label>
              <Input id="tm-rating" type="number" min={1} max={5} className="mt-1.5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="tm-order">ترتیب</Label>
              <Input id="tm-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
            نمایش در صفحه اصلی
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
          <p className="text-muted">هنوز نظری ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.authorName}</p>
                  {item.isFeatured && <Badge>ویژه</Badge>}
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted">{item.content}</p>
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
