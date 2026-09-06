"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { apiRequest } from "@/lib/academy/fetch-client";

export function CourseReviewForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { ok, data } = await apiRequest(`/api/academy/courses/${courseId}/reviews`, {
      method: "POST",
      body: { rating, content },
    });
    setLoading(false);
    if (!ok) {
      setMessage((data?.error as string) ?? "خطا در ثبت نظر");
      return;
    }
    setMessage("نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.");
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface space-y-3 p-4">
      <p className="text-sm font-medium text-foreground">ثبت نظر شما</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-accent" : "text-muted"}
            aria-label={`${n} ستاره`}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="نظر خود را درباره این دوره بنویسید..."
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "در حال ارسال..." : "ثبت نظر"}
      </Button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
