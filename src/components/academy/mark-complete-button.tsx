"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/academy/fetch-client";

export function MarkCompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { ok } = await apiRequest(`/api/academy/lessons/${lessonId}/progress`, {
      method: "POST",
      body: { isCompleted: true },
    });
    setLoading(false);
    if (ok) {
      setCompleted(true);
      router.refresh();
    }
  }

  if (completed) {
    return (
      <Button variant="secondary" disabled>
        ✓ تکمیل شده
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "در حال ثبت..." : "علامت‌گذاری به عنوان تکمیل شده"}
    </Button>
  );
}
