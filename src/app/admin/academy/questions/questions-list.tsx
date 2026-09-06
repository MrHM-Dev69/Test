"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { Course, CourseQuestion } from "@prisma/client";

type QuestionRow = CourseQuestion & { course: Course };

export function QuestionsList({ questions }: { questions: QuestionRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function submitAnswer(id: string) {
    const answer = drafts[id]?.trim();
    if (!answer) return;
    setBusyId(id);
    await csrfFetch(`/api/admin/academy/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ answer }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Card key={q.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{q.course.title}</span>
              <Badge variant={q.answer ? "success" : "warning"}>{q.answer ? "پاسخ داده شده" : "بدون پاسخ"}</Badge>
            </div>
            <p className="text-sm text-foreground">{q.question}</p>
            {q.answer ? (
              <p className="text-sm text-accent">پاسخ: {q.answer}</p>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={drafts[q.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                  placeholder="پاسخ خود را بنویسید..."
                />
                <Button size="sm" disabled={busyId === q.id} onClick={() => submitAnswer(q.id)}>
                  ثبت پاسخ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {questions.length === 0 && <p className="text-muted">سوالی ثبت نشده است.</p>}
    </div>
  );
}
