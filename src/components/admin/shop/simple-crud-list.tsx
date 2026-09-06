"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export interface SimpleField {
  name: string;
  label: string;
  type?: "text" | "number";
  placeholder?: string;
}

export interface SimpleItem {
  id: string;
  [key: string]: unknown;
}

// Minimal generic create+delete list UI for flat admin CRUD screens
// (categories, tags) where a full custom form would be overkill.
export function SimpleCrudList({
  apiBase,
  fields,
  items,
  renderItem,
  slugify,
}: {
  apiBase: string;
  fields: SimpleField[];
  items: SimpleItem[];
  renderItem: (item: SimpleItem) => React.ReactNode;
  slugify?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (slugify && values.name && !values.slug) {
        payload.slug = values.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
      }
      for (const f of fields) {
        if (f.type === "number" && payload[f.name] !== undefined) {
          payload[f.name] = Number(payload[f.name]);
        }
      }
      const res = await csrfFetch(apiBase, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      setValues({});
      router.refresh();
      toast({ title: "ثبت شد", variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await csrfFetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "خطا", description: data.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        {fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1">
            <label className="text-xs text-muted">{f.label}</label>
            <Input
              type={f.type ?? "text"}
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className="w-48"
            />
          </div>
        ))}
        <Button type="submit" disabled={saving}>
          افزودن
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            {renderItem(item)}
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
              حذف
            </Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">موردی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
