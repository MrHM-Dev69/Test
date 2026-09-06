"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

async function saveSetting(key: string, value: Record<string, unknown>) {
  const res = await csrfFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ key, value }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "خطا در ذخیره‌سازی");
}

export function GeneralSettingsForm({
  initial,
}: {
  initial: { siteName?: string; siteDescription?: string; contactEmail?: string; contactPhone?: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [siteName, setSiteName] = React.useState(initial.siteName ?? "");
  const [siteDescription, setSiteDescription] = React.useState(initial.siteDescription ?? "");
  const [contactEmail, setContactEmail] = React.useState(initial.contactEmail ?? "");
  const [contactPhone, setContactPhone] = React.useState(initial.contactPhone ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSetting("site_general", { siteName, siteDescription, contactEmail, contactPhone });
      toast({ title: "ذخیره شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>نام سایت</Label>
        <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label>ایمیل تماس</Label>
        <Input dir="ltr" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1.5" />
      </div>
      <div className="sm:col-span-2">
        <Label>توضیحات سایت</Label>
        <Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label>تلفن تماس</Label>
        <Input dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1.5" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>
    </form>
  );
}

export function SeoSettingsForm({ initial }: { initial: { defaultTitle?: string; defaultDescription?: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [defaultTitle, setDefaultTitle] = React.useState(initial.defaultTitle ?? "");
  const [defaultDescription, setDefaultDescription] = React.useState(initial.defaultDescription ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSetting("seo_defaults", { defaultTitle, defaultDescription });
      toast({ title: "ذخیره شد", variant: "success" });
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
        <Label>عنوان پیش‌فرض</Label>
        <Input value={defaultTitle} onChange={(e) => setDefaultTitle(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label>توضیحات پیش‌فرض</Label>
        <Textarea value={defaultDescription} onChange={(e) => setDefaultDescription(e.target.value)} className="mt-1.5" />
      </div>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </Button>
    </form>
  );
}
