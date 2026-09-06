"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function WishlistButton({ productId, initialWishlisted }: { productId: string; initialWishlisted: boolean }) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await csrfFetch("/api/shop/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast({ title: "خطا", variant: "destructive" });
        return;
      }
      const data = await res.json();
      setWishlisted(data.wishlisted);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline" size="lg">
      {wishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
    </Button>
  );
}
