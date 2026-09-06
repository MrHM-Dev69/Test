"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function FreeDownloadButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await csrfFetch(`/api/shop/products/${productId}/free-download`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast({ title: "خطا", description: data.error ?? "دانلود ناموفق بود", variant: "destructive" });
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="lg" variant="default">
      {loading ? "در حال آماده‌سازی..." : "دانلود رایگان"}
    </Button>
  );
}
