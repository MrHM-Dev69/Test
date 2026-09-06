"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function ReviewForm({ productId, eligible }: { productId: string; eligible: boolean }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!eligible) {
    return (
      <p className="text-sm text-muted">
        برای ثبت نظر باید این محصول را خریداری یا دانلود کرده باشید.
      </p>
    );
  }

  if (submitted) {
    return <p className="text-sm text-emerald-400">نظر شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await csrfFetch(`/api/shop/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, title: title || undefined, content: content || undefined }),
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
      toast({ title: "نظر شما ثبت شد", variant: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label>امتیاز</Label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 h-10 w-32 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ستاره
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>عنوان (اختیاری)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" maxLength={120} />
      </div>
      <div>
        <Label>نظر شما</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1" maxLength={2000} />
      </div>
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "در حال ارسال..." : "ثبت نظر"}
      </Button>
    </form>
  );
}
