"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface Initial {
  title: string;
  body: string;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
}

export function LegalPageEditor({ slug, initial }: { slug: string; initial: Initial }) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState(initial.title);
  const [body, setBody] = React.useState(initial.body);
  const [isPublished, setIsPublished] = React.useState(initial.isPublished);
  const [seoTitle, setSeoTitle] = React.useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = React.useState(initial.seoDescription);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/settings/legal", {
        method: "POST",
        body: JSON.stringify({ slug, title, body, isPublished, seoTitle, seoDescription }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا در ذخیره‌سازی");
      toast({ title: "صفحه ذخیره شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>عنوان صفحه</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1.5" />
      </div>
      <div>
        <Label>محتوا (HTML/Markdown ساده)</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} required className="mt-1.5 font-mono text-xs" dir="ltr" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>عنوان سئو (اختیاری)</Label>
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>توضیحات سئو (اختیاری)</Label>
          <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        منتشر شود
      </label>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "در حال ذخیره..." : "ذخیره صفحه"}
      </Button>
    </form>
  );
}
