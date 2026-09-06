"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function DownloadButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await csrfFetch("/api/shop/downloads/issue", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا در دانلود", description: data.error, variant: "destructive" });
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="sm">
      {loading ? "در حال آماده‌سازی..." : "دانلود"}
    </Button>
  );
}
