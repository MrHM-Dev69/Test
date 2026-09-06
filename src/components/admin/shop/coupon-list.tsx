"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";
import { formatToman } from "@/lib/utils";

export interface CouponRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  maxRedemptions: number | null;
  redeemedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export function CouponList({ coupons }: { coupons: CouponRow[] }) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/shop/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      setCode("");
      router.refresh();
      toast({ title: "کد تخفیف ایجاد شد", variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await csrfFetch(`/api/admin/shop/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted">کد</label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="mt-1 w-40" required />
        </div>
        <div>
          <label className="text-xs text-muted">نوع تخفیف</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
            className="mt-1 h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="PERCENT">درصدی</option>
            <option value="FIXED">مبلغ ثابت</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted">مقدار</label>
          <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="mt-1 w-32" />
        </div>
        <div>
          <label className="text-xs text-muted">سقف استفاده (اختیاری)</label>
          <Input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} className="mt-1 w-32" />
        </div>
        <Button type="submit" disabled={saving}>
          ایجاد کد تخفیف
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <div>
              <p className="font-medium">{c.code}</p>
              <p className="mt-1 text-xs text-muted">
                {c.discountType === "PERCENT" ? `${c.discountValue}%` : formatToman(c.discountValue)} —{" "}
                {c.redeemedCount}
                {c.maxRedemptions ? ` از ${c.maxRedemptions}` : ""} استفاده شده
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "فعال" : "غیرفعال"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleActive(c.id, c.isActive)}>
                {c.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-muted">کد تخفیفی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
