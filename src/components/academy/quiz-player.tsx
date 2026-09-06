"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/academy/fetch-client";

interface QuizQuestionView {
  id: string;
  prompt: string;
  choices: string[];
}

export function QuizPlayer({
  lessonId,
  questions,
}: {
  lessonId: string;
  questions: QuizQuestionView[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(
    null,
  );

  function selectAnswer(qIndex: number, choiceIndex: number) {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? choiceIndex : a)));
  }

  async function handleSubmit() {
    setLoading(true);
    const { ok, data } = await apiRequest(`/api/academy/lessons/${lessonId}/quiz/submit`, {
      method: "POST",
      body: { answers },
    });
    setLoading(false);
    if (ok) {
      setResult({ score: data.score, total: data.total, passed: data.passed });
      router.refresh();
    }
  }

  const allAnswered = answers.every((a) => a >= 0);

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 pt-6">
            <p className="font-medium text-foreground">
              {qi + 1}. {q.prompt}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice, ci) => (
                <label
                  key={ci}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${
                    answers[qi] === ci ? "border-accent bg-accent-muted" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === ci}
                    onChange={() => selectAnswer(qi, ci)}
                  />
                  {choice}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSubmit} disabled={!allAnswered || loading}>
        {loading ? "در حال ارسال..." : "ارسال پاسخ‌ها"}
      </Button>

      {result && (
        <p className={result.passed ? "text-emerald-400" : "text-red-400"}>
          نمره شما: {result.score} از ۱۰۰ ({result.total} سوال) —{" "}
          {result.passed ? "قبول شدید" : "قبول نشدید، دوباره تلاش کنید"}
        </p>
      )}
    </div>
  );
}
