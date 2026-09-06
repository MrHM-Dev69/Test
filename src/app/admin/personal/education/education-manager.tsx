"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  order: number;
}

interface FormState {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  degree: "",
  institution: "",
  fieldOfStudy: "",
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

export function EducationManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<EducationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/education");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  function startEdit(item: EducationItem) {
    setEditingId(item.id);
    setForm({
      degree: item.degree,
      institution: item.institution,
      fieldOfStudy: item.fieldOfStudy ?? "",
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      isCurrent: item.isCurrent,
      description: item.description ?? "",
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
        degree: form.degree,
        institution: form.institution,
        fieldOfStudy: form.fieldOfStudy,
        startDate: form.startDate,
        endDate: form.isCurrent ? undefined : form.endDate || undefined,
        isCurrent: form.isCurrent,
        description: form.description,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/education/${editingId}` : "/api/admin/personal/education";
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
    const res = await csrfFetch(`/api/admin/personal/education/${id}`, { method: "DELETE" });
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
          <h2 className="font-semibold">{editingId ? "ویرایش مورد تحصیلی" : "افزودن مورد تحصیلی"}</h2>
          <div>
            <Label htmlFor="edu-degree">مقطع تحصیلی</Label>
            <Input id="edu-degree" className="mt-1.5" value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="edu-institution">موسسه</Label>
            <Input id="edu-institution" className="mt-1.5" value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="edu-field">رشته تحصیلی</Label>
            <Input id="edu-field" className="mt-1.5" value={form.fieldOfStudy} onChange={(e) => setForm((p) => ({ ...p, fieldOfStudy: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edu-start">تاریخ شروع</Label>
              <Input id="edu-start" type="date" className="mt-1.5" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="edu-end">تاریخ پایان</Label>
              <Input
                id="edu-end"
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
            هم‌اکنون در حال تحصیل هستم
          </label>
          <div>
            <Label htmlFor="edu-desc">توضیحات</Label>
            <Textarea id="edu-desc" className="mt-1.5" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="edu-order">ترتیب</Label>
            <Input id="edu-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
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
                  {item.degree} — {item.institution}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {toDateInput(item.startDate)} — {item.isCurrent ? "در حال تحصیل" : toDateInput(item.endDate)}
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
