"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export interface QuestionRow {
  id: string;
  question: string;
  answer: string | null;
  productTitle: string;
  userName: string;
}

export function QuestionAnswerForm({ q }: { q: QuestionRow }) {
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/admin/shop/questions/${q.id}`, {
        method: "PATCH",
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        toast({ title: "خطا", variant: "destructive" });
        return;
      }
      toast({ title: "پاسخ ثبت شد", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="text-sm font-medium">
        {q.productTitle} — {q.userName}
      </p>
      <p className="mt-2 text-sm text-muted">{q.question}</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="پاسخ..." required />
        <Button type="submit" size="sm" disabled={saving} className="self-start">
          {saving ? "در حال ثبت..." : "ثبت پاسخ"}
        </Button>
      </form>
    </Card>
  );
}
