"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleChange(newStatus: OrderStatus) {
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/admin/shop/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "وضعیت سفارش بروزرسانی شد", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function RefundForm({ orderId, maxAmount }: { orderId: string; maxAmount: number }) {
  const [amount, setAmount] = useState(maxAmount);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/admin/shop/orders/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ amount, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "بازگشت وجه ثبت شد", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs text-muted">مبلغ بازگشتی</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 w-40" />
      </div>
      <div>
        <label className="text-xs text-muted">دلیل</label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-56" />
      </div>
      <Button type="submit" variant="destructive" disabled={saving}>
        {saving ? "در حال ثبت..." : "ثبت بازگشت وجه"}
      </Button>
    </form>
  );
}
