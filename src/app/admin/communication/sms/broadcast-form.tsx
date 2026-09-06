"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const SEGMENTS = [
  { value: "ALL", label: "همه کاربران دارای شماره تماس" },
  { value: "CUSTOMER", label: "فقط مشتریان" },
];

export function SmsBroadcastForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = React.useState("");
  const [segment, setSegment] = React.useState("CUSTOMER");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/admin/communication/sms/broadcast", {
        method: "POST",
        body: JSON.stringify({ body, segment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا در ارسال");
      toast({ title: `پیامک برای ${data.sent ?? 0} نفر ارسال شد (${data.failed ?? 0} ناموفق)`, variant: "success" });
      setBody("");
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
        <Label>متن پیامک</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={280} className="mt-1.5" />
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "در حال ارسال..." : "ارسال پیامک گروهی"}
        </Button>
      </div>
    </form>
  );
}
