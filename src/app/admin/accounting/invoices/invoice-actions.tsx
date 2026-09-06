"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function CreateInvoiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/admin/accounting/invoices", {
        method: "POST",
        body: JSON.stringify({ userEmail, amount: Number(amount), dueDate: dueDate || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا در ایجاد فاکتور");
      toast({ title: "فاکتور ایجاد شد", variant: "success" });
      setUserEmail("");
      setAmount("");
      setDueDate("");
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="userEmail">ایمیل کاربر</Label>
        <Input id="userEmail" dir="ltr" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required className="mt-1.5 w-56" />
      </div>
      <div>
        <Label htmlFor="amount">مبلغ (تومان)</Label>
        <Input id="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1.5 w-40" />
      </div>
      <div>
        <Label htmlFor="dueDate">سررسید (اختیاری)</Label>
        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 w-40" />
      </div>
      <Button type="submit" disabled={submitting}>
        ایجاد فاکتور
      </Button>
    </form>
  );
}

export function InvoiceRowActions({ invoiceId, status }: { invoiceId: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function markPaid() {
    setBusy(true);
    try {
      const res = await csrfFetch(`/api/admin/accounting/invoices/${invoiceId}/mark-paid`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      toast({ title: "فاکتور پرداخت‌شده علامت‌گذاری شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (status === "PAID") return <span className="text-xs text-muted">—</span>;

  return (
    <Button size="sm" variant="secondary" disabled={busy} onClick={markPaid}>
      علامت‌گذاری پرداخت‌شده
    </Button>
  );
}
