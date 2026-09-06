"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";
import { formatToman } from "@/lib/utils";

export interface CartItemView {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { title: string; slug: string; coverImage: string | null } | null;
}

export function CartItems({ items, subtotal }: { items: CartItemView[]; subtotal: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    const res = await csrfFetch(`/api/shop/cart/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      toast({ title: "خطا در بروزرسانی سبد خرید", variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function removeItem(itemId: string) {
    const res = await csrfFetch(`/api/shop/cart/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "خطا در حذف از سبد خرید", variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-muted">سبد خرید شما خالی است.</p>
        <Link href="/shop" className="mt-3 inline-block text-sm text-accent hover:underline">
          مشاهده محصولات
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <Card key={item.id} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
              {item.product?.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.coverImage} alt={item.product.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <Link href={`/shop/products/${item.product?.slug ?? ""}`} className="font-medium hover:text-accent">
                {item.product?.title ?? "محصول حذف شده"}
              </Link>
              <p className="mt-1 text-sm text-muted">{formatToman(item.unitPrice)} واحد</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={50}
              disabled={pending}
              defaultValue={item.quantity}
              onBlur={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="h-9 w-16 rounded-lg border border-border bg-surface px-2 text-center text-sm"
            />
            <span className="w-28 text-sm text-accent">{formatToman(item.total)}</span>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => removeItem(item.id)}>
              حذف
            </Button>
          </div>
        </Card>
      ))}
      <Card className="flex items-center justify-between">
        <span className="text-lg font-semibold">جمع کل</span>
        <span className="text-lg font-bold text-accent">{formatToman(subtotal)}</span>
      </Card>
      <Link href="/shop/checkout">
        <Button size="lg" className="w-full">
          ادامه فرآیند خرید
        </Button>
      </Link>
    </div>
  );
}
