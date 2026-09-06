"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { CourseSection, Lesson, LessonAttachment, LessonType, Quiz, QuizQuestion } from "@prisma/client";

type LessonWithExtras = Lesson & { attachments: LessonAttachment[]; quiz: (Quiz & { questions: QuizQuestion[] }) | null };
type SectionWithLessons = CourseSection & { lessons: LessonWithExtras[] };

const TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "ویدیو",
  ARTICLE: "مقاله",
  QUIZ: "آزمون",
  ATTACHMENT: "فایل ضمیمه",
};

export function SectionsManager({ courseId, sections }: { courseId: string; sections: SectionWithLessons[] }) {
  const router = useRouter();
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    setBusy(true);
    await csrfFetch(`/api/admin/academy/courses/${courseId}/sections`, {
      method: "POST",
      body: JSON.stringify({ title: newSectionTitle }),
    });
    setBusy(false);
    setNewSectionTitle("");
    router.refresh();
  }

  async function moveSection(section: SectionWithLessons, direction: -1 | 1) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === section.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    setBusy(true);
    await Promise.all([
      csrfFetch(`/api/admin/academy/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: swapWith.order }),
      }),
      csrfFetch(`/api/admin/academy/sections/${swapWith.id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: section.order }),
      }),
    ]);
    setBusy(false);
    router.refresh();
  }

  async function deleteSection(id: string) {
    if (!confirm("این بخش و تمام درس‌های آن حذف شود؟")) return;
    setBusy(true);
    await csrfFetch(`/api/admin/academy/sections/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {[...sections]
        .sort((a, b) => a.order - b.order)
        .map((section, i) => (
          <Card key={section.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={busy || i === 0} onClick={() => moveSection(section, -1)}>
                  ▲
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || i === sections.length - 1}
                  onClick={() => moveSection(section, 1)}
                >
                  ▼
                </Button>
                <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteSection(section.id)}>
                  حذف بخش
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LessonsManager sectionId={section.id} lessons={section.lessons} />
            </CardContent>
          </Card>
        ))}

      <form onSubmit={addSection} className="flex gap-2">
        <Input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="عنوان بخش جدید..."
        />
        <Button type="submit" disabled={busy}>
          افزودن بخش
        </Button>
      </form>
    </div>
  );
}

function LessonsManager({ sectionId, lessons }: { sectionId: string; lessons: LessonWithExtras[] }) {
  const router = useRouter();
  const [newLesson, setNewLesson] = useState({ title: "", type: "VIDEO" as LessonType });
  const [busy, setBusy] = useState(false);

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLesson.title.trim()) return;
    setBusy(true);
    await csrfFetch(`/api/admin/academy/sections/${sectionId}/lessons`, {
      method: "POST",
      body: JSON.stringify(newLesson),
    });
    setBusy(false);
    setNewLesson({ title: "", type: "VIDEO" });
    router.refresh();
  }

  async function moveLesson(lesson: LessonWithExtras, direction: -1 | 1) {
    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === lesson.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    setBusy(true);
    await Promise.all([
      csrfFetch(`/api/admin/academy/lessons/${lesson.id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: swapWith.order }),
      }),
      csrfFetch(`/api/admin/academy/lessons/${swapWith.id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: lesson.order }),
      }),
    ]);
    setBusy(false);
    router.refresh();
  }

  async function deleteLesson(id: string) {
    if (!confirm("این درس حذف شود؟")) return;
    setBusy(true);
    await csrfFetch(`/api/admin/academy/lessons/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  async function togglePreview(lesson: LessonWithExtras) {
    setBusy(true);
    await csrfFetch(`/api/admin/academy/lessons/${lesson.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPreview: !lesson.isPreview }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {[...lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson, i) => (
          <div key={lesson.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                <Badge variant="secondary">{TYPE_LABELS[lesson.type]}</Badge>
                {lesson.isPreview && <Badge variant="success">پیش‌نمایش رایگان</Badge>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={busy || i === 0} onClick={() => moveLesson(lesson, -1)}>
                  ▲
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || i === lessons.length - 1}
                  onClick={() => moveLesson(lesson, 1)}
                >
                  ▼
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => togglePreview(lesson)}>
                  {lesson.isPreview ? "حذف پیش‌نمایش" : "علامت پیش‌نمایش"}
                </Button>
                <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteLesson(lesson.id)}>
                  حذف
                </Button>
              </div>
            </div>

            {lesson.type === "VIDEO" && <VideoUploader lessonId={lesson.id} hasVideo={Boolean(lesson.contentUrl)} />}
            {lesson.type === "ARTICLE" && <ArticleBodyEditor lesson={lesson} />}
            {lesson.type === "QUIZ" && <QuizEditor lesson={lesson} />}
            <AttachmentUploader lessonId={lesson.id} attachments={lesson.attachments} />
          </div>
        ))}

      <form onSubmit={addLesson} className="flex flex-wrap gap-2">
        <Input
          value={newLesson.title}
          onChange={(e) => setNewLesson((f) => ({ ...f, title: e.target.value }))}
          placeholder="عنوان درس جدید..."
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          value={newLesson.type}
          onChange={(e) => setNewLesson((f) => ({ ...f, type: e.target.value as LessonType }))}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={busy}>
          افزودن درس
        </Button>
      </form>
    </div>
  );
}

function VideoUploader({ lessonId, hasVideo }: { lessonId: string; hasVideo: boolean }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "video");
    await csrfFetch(`/api/admin/academy/lessons/${lessonId}/upload`, { method: "POST", body: formData });
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="mt-2 text-xs text-muted">
      {hasVideo ? "ویدیو بارگذاری شده" : "ویدیویی بارگذاری نشده"} —{" "}
      <label className="cursor-pointer text-accent hover:underline">
        {uploading ? "در حال آپلود..." : "آپلود ویدیو"}
        <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

function AttachmentUploader({ lessonId, attachments }: { lessonId: string; attachments: LessonAttachment[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "attachment");
    await csrfFetch(`/api/admin/academy/lessons/${lessonId}/upload`, { method: "POST", body: formData });
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="mt-2 text-xs text-muted">
      فایل‌های ضمیمه: {attachments.map((a) => a.fileName).join("، ") || "ندارد"} —{" "}
      <label className="cursor-pointer text-accent hover:underline">
        {uploading ? "در حال آپلود..." : "افزودن فایل ضمیمه"}
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

function ArticleBodyEditor({ lesson }: { lesson: LessonWithExtras }) {
  const router = useRouter();
  const [body, setBody] = useState(lesson.contentBody ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await csrfFetch(`/api/admin/academy/lessons/${lesson.id}`, {
      method: "PATCH",
      body: JSON.stringify({ contentBody: body }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        className="min-h-24 w-full rounded-lg border border-border bg-surface p-2 text-sm text-foreground"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="متن مقاله این درس..."
      />
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "در حال ذخیره..." : "ذخیره متن"}
      </Button>
    </div>
  );
}

function QuizEditor({ lesson }: { lesson: LessonWithExtras }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(
    lesson.quiz?.questions.map((q) => ({ prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex, order: q.order })) ?? [],
  );
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions((qs) => [...qs, { prompt: "", choices: ["", ""], correctIndex: 0, order: qs.length }]);
  }

  function updateQuestion(i: number, patch: Partial<(typeof questions)[number]>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateChoice(qi: number, ci: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, idx) => (idx === qi ? { ...q, choices: q.choices.map((c, i2) => (i2 === ci ? value : c)) } : q)),
    );
  }

  function addChoice(qi: number) {
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, choices: [...q.choices, ""] } : q)));
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    await csrfFetch(`/api/admin/academy/lessons/${lesson.id}/quiz`, {
      method: "PUT",
      body: JSON.stringify({ questions: questions.map((q, i) => ({ ...q, order: i })) }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-3 rounded-lg bg-white/5 p-3">
      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded-lg border border-border p-2">
          <Input
            value={q.prompt}
            onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
            placeholder={`متن سوال ${qi + 1}`}
          />
          {q.choices.map((c, ci) => (
            <div key={ci} className="flex items-center gap-2">
              <input
                type="radio"
                checked={q.correctIndex === ci}
                onChange={() => updateQuestion(qi, { correctIndex: ci })}
              />
              <Input value={c} onChange={(e) => updateChoice(qi, ci, e.target.value)} placeholder={`گزینه ${ci + 1}`} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" type="button" onClick={() => addChoice(qi)}>
              افزودن گزینه
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => removeQuestion(qi)}>
              حذف سوال
            </Button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" type="button" onClick={addQuestion}>
          افزودن سوال
        </Button>
        <Button size="sm" type="button" onClick={save} disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره آزمون"}
        </Button>
      </div>
    </div>
  );
}
