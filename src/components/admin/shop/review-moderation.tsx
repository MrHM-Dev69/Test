"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  productTitle: string;
  userName: string;
}

export function ReviewModeration({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  async function moderate(id: string, isApproved: boolean) {
    const res = await csrfFetch(`/api/admin/shop/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    });
    if (!res.ok) {
      toast({ title: "خطا", variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    const res = await csrfFetch(`/api/admin/shop/reviews/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (reviews.length === 0) return <p className="text-muted">نظری در انتظار بررسی نیست.</p>;

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {r.productTitle} — {r.userName}
            </p>
            <span className="text-amber-400">{"★".repeat(r.rating)}</span>
          </div>
          {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
          {r.content && <p className="mt-1 text-sm text-muted">{r.content}</p>}
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => moderate(r.id, true)}>
              تایید
            </Button>
            <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>
              رد و حذف
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
