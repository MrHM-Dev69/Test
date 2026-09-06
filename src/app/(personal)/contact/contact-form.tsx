"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const INITIAL_STATE: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const res = await csrfFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues as { path: (string | number)[]; message: string }[]) {
            fieldErrors[String(issue.path[0])] = issue.message;
          }
          setErrors(fieldErrors);
        }
        toast({
          title: "ارسال پیام ناموفق بود",
          description: data.error ?? "لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "پیام شما ارسال شد", description: "به زودی پاسخ داده خواهد شد.", variant: "success" });
      setForm(INITIAL_STATE);
    } catch {
      toast({ title: "خطا در ارتباط با سرور", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">نام و نام خانوادگی</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          className="mt-1.5"
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            className="mt-1.5"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="phone">تلفن (اختیاری)</Label>
          <Input
            id="phone"
            dir="ltr"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subject">موضوع (اختیاری)</Label>
        <Input
          id="subject"
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="message">پیام</Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          required
          rows={6}
          className="mt-1.5"
        />
        {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "در حال ارسال..." : "ارسال پیام"}
      </Button>
    </form>
  );
}
