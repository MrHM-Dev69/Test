"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Course } from "@prisma/client";

export function AdminGrantForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    const res = await csrfFetch("/api/admin/academy/enrollments", {
      method: "POST",
      body: JSON.stringify({ identifier, courseId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(data?.error ?? "خطا در ثبت‌نام");
      return;
    }
    setMessage("ثبت‌نام با موفقیت انجام شد.");
    setIdentifier("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface flex flex-wrap items-end gap-3 p-4">
      <div>
        <label className="text-sm text-muted">ایمیل یا شماره تماس کاربر</label>
        <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="w-64" />
      </div>
      <div>
        <label className="text-sm text-muted">دوره</label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={busy}>
        ثبت‌نام دستی (بدون پرداخت)
      </Button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
