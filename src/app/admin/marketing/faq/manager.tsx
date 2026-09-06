"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { FaqItem } from "@prisma/client";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function FaqManager({ items }: { items: FaqItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await csrfFetch("/api/admin/marketing/faq", {
        method: "POST",
        body: JSON.stringify({ question, answer, group: group || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setQuestion("");
      setAnswer("");
      setGroup("");
      toast({ title: "سوال ایجاد شد", variant: "success" });
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
      await csrfFetch(`/api/admin/marketing/faq/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={create} className="flex flex-col gap-3">
        <div>
          <Label>سوال</Label>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} required className="mt-1.5" />
        </div>
        <div>
          <Label>پاسخ</Label>
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required className="mt-1.5" />
        </div>
        <div>
          <Label>گروه (اختیاری)</Label>
          <Input value={group} onChange={(e) => setGroup(e.target.value)} className="mt-1.5 max-w-xs" />
        </div>
        <Button type="submit" disabled={busy} className="self-start">
          افزودن سوال
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {items.length === 0 && <p className="text-sm text-muted">سوالی ثبت نشده است.</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">{item.question}</p>
              <button onClick={() => remove(item.id)} disabled={busy} className="text-xs text-muted hover:text-red-400">
                حذف
              </button>
            </div>
            <p className="mt-1 text-muted">{item.answer}</p>
            {item.group && <p className="mt-1 text-xs text-accent">{item.group}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
