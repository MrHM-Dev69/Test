"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { apiRequest } from "@/lib/academy/fetch-client";

export function CourseQuestionForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { ok, data } = await apiRequest(`/api/academy/courses/${courseId}/questions`, {
      method: "POST",
      body: { question },
    });
    setLoading(false);
    if (!ok) {
      setMessage((data?.error as string) ?? "خطا در ثبت سوال");
      return;
    }
    setMessage("سوال شما ثبت شد.");
    setQuestion("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface space-y-3 p-4">
      <p className="text-sm font-medium text-foreground">پرسش شما</p>
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="سوال خود را درباره این دوره بپرسید..."
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "در حال ارسال..." : "ارسال سوال"}
      </Button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
