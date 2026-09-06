"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialUrl: string | null;
  imageUrl: string | null;
  order: number;
}

interface FormState {
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialUrl: string;
  imageUrl: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialUrl: "",
  imageUrl: "",
  order: "0",
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function CertificatesManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/certificates");
    const data = await res.json();
    setItems(data.certificates ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: Certificate) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      issuer: item.issuer,
      issueDate: toDateInput(item.issueDate),
      expiryDate: toDateInput(item.expiryDate),
      credentialUrl: item.credentialUrl ?? "",
      imageUrl: item.imageUrl ?? "",
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
        title: form.title,
        issuer: form.issuer,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        credentialUrl: form.credentialUrl,
        imageUrl: form.imageUrl,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/certificates/${editingId}` : "/api/admin/personal/certificates";
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
    if (!confirm("آیا از حذف این گواهینامه مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/certificates/${id}`, { method: "DELETE" });
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
          <h2 className="font-semibold">{editingId ? "ویرایش گواهینامه" : "افزودن گواهینامه"}</h2>
          <div>
            <Label htmlFor="cert-title">عنوان</Label>
            <Input id="cert-title" className="mt-1.5" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="cert-issuer">صادرکننده</Label>
            <Input id="cert-issuer" className="mt-1.5" value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cert-issue">تاریخ صدور</Label>
              <Input id="cert-issue" type="date" className="mt-1.5" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="cert-expiry">تاریخ انقضا</Label>
              <Input id="cert-expiry" type="date" className="mt-1.5" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="cert-credential">آدرس گواهینامه</Label>
            <Input id="cert-credential" dir="ltr" className="mt-1.5" value={form.credentialUrl} onChange={(e) => setForm((p) => ({ ...p, credentialUrl: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="cert-image">آدرس تصویر</Label>
            <Input id="cert-image" dir="ltr" className="mt-1.5" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="cert-order">ترتیب</Label>
            <Input id="cert-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
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
          <p className="text-muted">هنوز گواهینامه‌ای ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.issuer} — {toDateInput(item.issueDate)}
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
