"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Banner } from "@prisma/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const EMPTY = { title: "", imageUrl: "", linkUrl: "", placement: "home_hero", order: "0" };

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState(EMPTY);
  const [busy, setBusy] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await csrfFetch("/api/admin/marketing/banners", {
        method: "POST",
        body: JSON.stringify({ ...form, order: Number(form.order) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      toast({ title: "بنر ایجاد شد", variant: "success" });
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(banner: Banner) {
    setBusy(true);
    try {
      await csrfFetch(`/api/admin/marketing/banners/${banner.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(banner: Banner) {
    setBusy(true);
    try {
      await csrfFetch(`/api/admin/marketing/banners/${banner.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div>
          <Label>عنوان</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 w-48" />
        </div>
        <div>
          <Label>آدرس تصویر</Label>
          <Input dir="ltr" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required className="mt-1.5 w-64" />
        </div>
        <div>
          <Label>لینک (اختیاری)</Label>
          <Input dir="ltr" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="mt-1.5 w-48" />
        </div>
        <div>
          <Label>محل نمایش</Label>
          <Input value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="mt-1.5 w-32" />
        </div>
        <div>
          <Label>ترتیب</Label>
          <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="mt-1.5 w-20" />
        </div>
        <Button type="submit" disabled={busy}>
          افزودن
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {banners.length === 0 && <p className="text-sm text-muted">بنری ثبت نشده است.</p>}
        {banners.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt={b.title} className="h-10 w-16 rounded object-cover" />
              <div>
                <p>{b.title}</p>
                <p className="text-xs text-muted">{b.placement}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={b.isActive ? "success" : "secondary"}>{b.isActive ? "فعال" : "غیرفعال"}</Badge>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => toggleActive(b)}>
                {b.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </Button>
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(b)}>
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
