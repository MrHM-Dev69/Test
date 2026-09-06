"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface Experience {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  order: number;
}

interface FormState {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  role: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  order: "0",
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function ExperienceManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/experience");
    const data = await res.json();
    setItems(data.experiences ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  function startEdit(item: Experience) {
    setEditingId(item.id);
    setForm({
      role: item.role,
      company: item.company,
      location: item.location ?? "",
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      isCurrent: item.isCurrent,
      description: item.description,
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
        role: form.role,
        company: form.company,
        location: form.location,
        startDate: form.startDate,
        endDate: form.isCurrent ? undefined : form.endDate || undefined,
        isCurrent: form.isCurrent,
        description: form.description,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/experience/${editingId}` : "/api/admin/personal/experience";
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
    if (!confirm("آیا از حذف این مورد مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/experience/${id}`, { method: "DELETE" });
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
          <h2 className="font-semibold">{editingId ? "ویرایش سابقه" : "افزودن سابقه"}</h2>
          <div>
            <Label htmlFor="exp-role">عنوان شغلی</Label>
            <Input id="exp-role" className="mt-1.5" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="exp-company">شرکت</Label>
            <Input id="exp-company" className="mt-1.5" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="exp-location">مکان</Label>
            <Input id="exp-location" className="mt-1.5" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp-start">تاریخ شروع</Label>
              <Input id="exp-start" type="date" className="mt-1.5" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="exp-end">تاریخ پایان</Label>
              <Input
                id="exp-end"
                type="date"
                className="mt-1.5"
                value={form.endDate}
                disabled={form.isCurrent}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm((p) => ({ ...p, isCurrent: e.target.checked }))}
            />
            هم‌اکنون مشغول به کار هستم
          </label>
          <div>
            <Label htmlFor="exp-desc">توضیحات</Label>
            <Textarea id="exp-desc" className="mt-1.5" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="exp-order">ترتیب</Label>
            <Input id="exp-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
          </div>
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
          <p className="text-muted">هنوز موردی ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {item.role} — {item.company}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {toDateInput(item.startDate)} — {item.isCurrent ? "اکنون" : toDateInput(item.endDate)}
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
