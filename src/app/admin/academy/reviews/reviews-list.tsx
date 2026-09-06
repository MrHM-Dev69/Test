"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Course, CourseReview, User } from "@prisma/client";

type ReviewRow = CourseReview & { user: User; course: Course };

export function ReviewsList({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setApproved(id: string, isApproved: boolean) {
    setBusyId(id);
    await csrfFetch(`/api/admin/academy/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("این نظر حذف شود؟")) return;
    setBusyId(id);
    await csrfFetch(`/api/admin/academy/reviews/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {r.user.name ?? r.user.email} — {r.course.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-accent">{"★".repeat(r.rating)}</span>
                <Badge variant={r.isApproved ? "success" : "warning"}>
                  {r.isApproved ? "تایید شده" : "در انتظار"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted">{r.content}</p>
            <div className="flex gap-2">
              {!r.isApproved && (
                <Button size="sm" disabled={busyId === r.id} onClick={() => setApproved(r.id, true)}>
                  تایید
                </Button>
              )}
              {r.isApproved && (
                <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setApproved(r.id, false)}>
                  لغو تایید
                </Button>
              )}
              <Button size="sm" variant="destructive" disabled={busyId === r.id} onClick={() => remove(r.id)}>
                حذف
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {reviews.length === 0 && <p className="text-muted">نظری ثبت نشده است.</p>}
    </div>
  );
}
