"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/security/csrf-client";
import {
  PROJECT_TYPE_VALUES,
  PROJECT_TYPE_LABELS,
  BUDGET_RANGE_VALUES,
  BUDGET_RANGE_LABELS,
  PROJECT_PRIORITY_VALUES,
  PROJECT_PRIORITY_LABELS,
} from "@/lib/validation/project-request";

const DOMAIN_OPTIONS = [
  { value: "", label: "بدون حوزه خاص" },
  { value: "WEB", label: "وب" },
  { value: "WORDPRESS", label: "وردپرس" },
  { value: "FIVEM", label: "FiveM" },
  { value: "VMP", label: "VMP" },
  { value: "MTA", label: "MTA" },
  { value: "GENERAL", label: "عمومی" },
];

const INITIAL = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  projectType: PROJECT_TYPE_VALUES[0],
  categoryDomain: "",
  description: "",
  requirements: "",
  budgetRange: BUDGET_RANGE_VALUES[4],
  deadline: "",
  priority: PROJECT_PRIORITY_VALUES[1],
};

export function CustomDevelopmentForm() {
  const { toast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof INITIAL>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) fd.set(k, v);
      for (const file of files) fd.append("attachments", file);

      const res = await fetch("/api/project-requests", {
        method: "POST",
        body: fd,
        headers: { "x-csrf-token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.issues) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues as { path: (string | number)[]; message: string }[]) {
            fieldErrors[String(issue.path[0])] = issue.message;
          }
          setErrors(fieldErrors);
        }
        toast({ title: "ثبت درخواست ناموفق بود", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "درخواست شما ثبت شد", description: "به‌زودی با شما تماس گرفته می‌شود.", variant: "success" });
      setForm(INITIAL);
      setFiles([]);
    } catch {
      toast({ title: "خطا در ارتباط با سرور", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactName">نام و نام خانوادگی</Label>
          <Input id="contactName" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} required className="mt-1.5" />
          {errors.contactName && <p className="mt-1 text-xs text-red-400">{errors.contactName}</p>}
        </div>
        <div>
          <Label htmlFor="contactEmail">ایمیل</Label>
          <Input id="contactEmail" type="email" dir="ltr" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} required className="mt-1.5" />
          {errors.contactEmail && <p className="mt-1 text-xs text-red-400">{errors.contactEmail}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="contactPhone">تلفن (اختیاری)</Label>
        <Input id="contactPhone" dir="ltr" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="mt-1.5" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="projectType">نوع پروژه</Label>
          <select
            id="projectType"
            value={form.projectType}
            onChange={(e) => update("projectType", e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {PROJECT_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {PROJECT_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="categoryDomain">حوزه</Label>
          <select
            id="categoryDomain"
            value={form.categoryDomain}
            onChange={(e) => update("categoryDomain", e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {DOMAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">توضیحات پروژه</Label>
        <Textarea id="description" rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} required className="mt-1.5" />
        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="requirements">نیازمندی‌های فنی (اختیاری)</Label>
        <Textarea id="requirements" rows={4} value={form.requirements} onChange={(e) => update("requirements", e.target.value)} className="mt-1.5" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="budgetRange">بودجه</Label>
          <select
            id="budgetRange"
            value={form.budgetRange}
            onChange={(e) => update("budgetRange", e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {BUDGET_RANGE_VALUES.map((v) => (
              <option key={v} value={v}>
                {BUDGET_RANGE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="deadline">مهلت مورد نظر (اختیاری)</Label>
          <Input id="deadline" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="priority">اولویت</Label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {PROJECT_PRIORITY_VALUES.map((v) => (
              <option key={v} value={v}>
                {PROJECT_PRIORITY_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="attachments">پیوست‌ها (اختیاری، حداکثر ۵ فایل)</Label>
        <input
          id="attachments"
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
          className="mt-1.5 block w-full text-sm text-muted file:me-3 file:rounded-lg file:border-0 file:bg-accent-muted file:px-3 file:py-2 file:text-accent"
        />
        {files.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "در حال ارسال..." : "ثبت درخواست پروژه"}
      </Button>
    </form>
  );
}
