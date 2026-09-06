"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await csrfFetch("/api/shop/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast({ title: "خطا", description: data.error ?? "افزودن به سبد خرید ناموفق بود", variant: "destructive" });
        return;
      }
      toast({ title: "به سبد خرید اضافه شد", variant: "success" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="lg">
      {loading ? "در حال افزودن..." : "افزودن به سبد خرید"}
    </Button>
  );
}
