"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/academy/fetch-client";

export function EnrollButton({
  courseId,
  isFree,
  isLoggedIn,
  courseSlug,
}: {
  courseId: string;
  isFree: boolean;
  isLoggedIn: boolean;
  courseSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/academy/courses/${courseSlug}`);
      return;
    }
    setLoading(true);
    setError(null);
    const { ok, data } = await apiRequest(`/api/academy/courses/${courseId}/enroll`, {
      method: "POST",
      body: {},
    });
    setLoading(false);
    if (!ok) {
      setError((data?.error as string) ?? "خطایی رخ داد");
      return;
    }
    if (data?.redirectUrl) {
      window.location.href = data.redirectUrl as string;
      return;
    }
    router.push(`/academy/courses/${courseSlug}/learn`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? "در حال پردازش..." : isFree ? "ثبت‌نام رایگان" : "خرید و ثبت‌نام"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
