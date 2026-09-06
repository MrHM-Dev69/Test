"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const SEGMENTS = [
  { value: "ALL", label: "همه کاربران" },
  { value: "CUSTOMER", label: "فقط مشتریان" },
  { value: "ADMIN_STAFF", label: "کارکنان پنل مدیریت" },
];

export function BroadcastForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [segment, setSegment] = React.useState("ALL");
  const [link, setLink] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/admin/communication/notifications", {
        method: "POST",
        body: JSON.stringify({ title, body, segment, link: link || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا در ارسال");
      toast({ title: `اعلان برای ${data.count ?? 0} کاربر ارسال شد`, variant: "success" });
      setTitle("");
      setBody("");
      setLink("");
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label>عنوان</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1.5" />
      </div>
      <div>
        <Label>متن اعلان</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} required className="mt-1.5" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>مخاطبان</Label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="mt-1.5 h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>لینک (اختیاری)</Label>
          <Input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} className="mt-1.5 w-56" />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "در حال ارسال..." : "ارسال اعلان"}
        </Button>
      </div>
    </form>
  );
}
