"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { NavigationItem } from "@prisma/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const EMPTY = { label: "", url: "", location: "header", parentId: "" };

export function NavigationManager({ items }: { items: NavigationItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState(EMPTY);
  const [busy, setBusy] = React.useState(false);

  const topLevel = items.filter((i) => !i.parentId);
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await csrfFetch("/api/admin/marketing/navigation", {
        method: "POST",
        body: JSON.stringify({ ...form, parentId: form.parentId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setForm(EMPTY);
      toast({ title: "آیتم ایجاد شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await csrfFetch(`/api/admin/marketing/navigation/${id}`, { method: "DELETE" });
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
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required className="mt-1.5 w-40" />
        </div>
        <div>
          <Label>آدرس (URL)</Label>
          <Input dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required className="mt-1.5 w-48" />
        </div>
        <div>
          <Label>محل</Label>
          <select
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1.5 h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="header">هدر</option>
            <option value="footer">فوتر</option>
          </select>
        </div>
        <div>
          <Label>والد (اختیاری)</Label>
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className="mt-1.5 h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">بدون والد</option>
            {topLevel.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          افزودن
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {topLevel.length === 0 && <p className="text-sm text-muted">آیتمی ثبت نشده است.</p>}
        {topLevel.map((item) => (
          <div key={item.id} className="rounded-lg border border-border/50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{item.label}</span>
                <Badge variant="secondary">{item.location === "header" ? "هدر" : "فوتر"}</Badge>
                <span dir="ltr" className="text-xs text-muted">
                  {item.url}
                </span>
              </div>
              <button onClick={() => remove(item.id)} disabled={busy} className="text-xs text-muted hover:text-red-400">
                حذف
              </button>
            </div>
            {childrenOf(item.id).length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-r border-border pr-3 mr-3">
                {childrenOf(item.id).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-muted">
                    <span>
                      {c.label} · <span dir="ltr">{c.url}</span>
                    </span>
                    <button onClick={() => remove(c.id)} disabled={busy} className="hover:text-red-400">
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
