"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function QuestionForm({ productId }: { productId: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (submitted) {
    return <p className="text-sm text-emerald-400">پرسش شما ثبت شد و پس از پاسخ نمایش داده می‌شود.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await csrfFetch(`/api/shop/products/${productId}/questions`, {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      setSubmitted(true);
      toast({ title: "پرسش شما ثبت شد", variant: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="پرسش خود را درباره این محصول بنویسید..."
        minLength={5}
        maxLength={1000}
        required
      />
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "در حال ارسال..." : "ارسال پرسش"}
      </Button>
    </form>
  );
}
