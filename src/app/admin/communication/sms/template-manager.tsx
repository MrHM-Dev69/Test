"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SmsTemplate } from "@prisma/client";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function SmsTemplateManager({ templates }: { templates: SmsTemplate[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [key, setKey] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await csrfFetch("/api/admin/communication/sms/templates", {
        method: "POST",
        body: JSON.stringify({ key, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setKey("");
      setBody("");
      toast({ title: "قالب ایجاد شد", variant: "success" });
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
      await csrfFetch(`/api/admin/communication/sms/templates/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <Label>کلید قالب</Label>
          <Input dir="ltr" value={key} onChange={(e) => setKey(e.target.value)} required className="mt-1.5 w-40" />
        </div>
        <div className="flex-1">
          <Label>متن قالب</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} required className="mt-1.5" />
        </div>
        <Button type="submit" disabled={busy}>
          افزودن
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {templates.length === 0 && <p className="text-sm text-muted">قالبی ثبت نشده است.</p>}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
            <div>
              <p dir="ltr" className="font-medium">
                {t.key}
              </p>
              <p className="text-muted">{t.body}</p>
            </div>
            <button onClick={() => remove(t.id)} disabled={busy} className="text-xs text-muted hover:text-red-400">
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
