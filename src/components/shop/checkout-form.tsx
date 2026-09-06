"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function CheckoutForm() {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await csrfFetch("/api/shop/checkout", {
        method: "POST",
        body: JSON.stringify({ couponCode: couponCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا در پرداخت", description: data.error, variant: "destructive" });
        return;
      }
      router.push(data.redirectUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>کد تخفیف (اختیاری)</Label>
        <Input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="mt-1"
          placeholder="کد تخفیف را وارد کنید"
        />
      </div>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "در حال انتقال به درگاه پرداخت..." : "پرداخت"}
      </Button>
    </form>
  );
}
