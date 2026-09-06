"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";
import { formatToman } from "@/lib/utils";

export interface GiftCardRow {
  id: string;
  code: string;
  initialValue: string;
  balance: string;
  isActive: boolean;
}

export function GiftCardList({ giftCards }: { giftCards: GiftCardRow[] }) {
  const [initialValue, setInitialValue] = useState(100000);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/shop/gift-cards", {
        method: "POST",
        body: JSON.stringify({ initialValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      router.refresh();
      toast({ title: `کارت هدیه ${data.giftCard.code} ایجاد شد`, variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await csrfFetch(`/api/admin/shop/gift-cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted">مبلغ اولیه (تومان)</label>
          <Input type="number" value={initialValue} onChange={(e) => setInitialValue(Number(e.target.value))} className="mt-1 w-40" />
        </div>
        <Button type="submit" disabled={saving}>
          صدور کارت هدیه
        </Button>
      </form>
      <p className="text-xs text-amber-400">
        توجه: مصرف کارت هدیه در تسویه‌حساب فروشگاه هنوز پیاده‌سازی نشده و فقط صدور کارت فعال است.
      </p>

      <div className="flex flex-col gap-2">
        {giftCards.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <div>
              <p className="font-medium">{g.code}</p>
              <p className="mt-1 text-xs text-muted">
                موجودی {formatToman(g.balance)} از {formatToman(g.initialValue)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={g.isActive ? "success" : "secondary"}>{g.isActive ? "فعال" : "غیرفعال"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleActive(g.id, g.isActive)}>
                {g.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </Button>
            </div>
          </div>
        ))}
        {giftCards.length === 0 && <p className="text-sm text-muted">کارت هدیه‌ای صادر نشده است.</p>}
      </div>
    </div>
  );
}
