"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface ProfileFormState {
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  resumeFileUrl: string;
  email: string;
  phone: string;
  location: string;
  availability: string;
  yearsExperience: string;
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  telegram: string;
}

const EMPTY_STATE: ProfileFormState = {
  fullName: "",
  headline: "",
  bio: "",
  avatarUrl: "",
  resumeFileUrl: "",
  email: "",
  phone: "",
  location: "",
  availability: "",
  yearsExperience: "",
  github: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  telegram: "",
};

interface ProfileApiShape {
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string | null;
  resumeFileUrl: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  availability: string | null;
  yearsExperience: number | null;
  socialLinks: Record<string, string> | null;
}

export function ProfileForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/personal/profile");
        const data = await res.json();
        const profile = data.profile as ProfileApiShape | null;
        if (profile) {
          const social = profile.socialLinks ?? {};
          setForm({
            fullName: profile.fullName,
            headline: profile.headline,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl ?? "",
            resumeFileUrl: profile.resumeFileUrl ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            location: profile.location ?? "",
            availability: profile.availability ?? "",
            yearsExperience: profile.yearsExperience?.toString() ?? "",
            github: social.github ?? "",
            linkedin: social.linkedin ?? "",
            twitter: social.twitter ?? "",
            instagram: social.instagram ?? "",
            telegram: social.telegram ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        fullName: form.fullName,
        headline: form.headline,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        resumeFileUrl: form.resumeFileUrl,
        email: form.email,
        phone: form.phone,
        location: form.location,
        availability: form.availability,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        socialLinks: {
          github: form.github,
          linkedin: form.linkedin,
          twitter: form.twitter,
          instagram: form.instagram,
          telegram: form.telegram,
        },
      };
      const res = await csrfFetch("/api/admin/personal/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
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
        toast({ title: "ذخیره ناموفق بود", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "پروفایل ذخیره شد", variant: "success" });
    } catch {
      toast({ title: "خطا در ارتباط با سرور", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">در حال بارگذاری...</p>;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">نام کامل</Label>
            <Input id="fullName" className="mt-1.5" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
          </div>
          <div>
            <Label htmlFor="headline">عنوان شغلی</Label>
            <Input id="headline" className="mt-1.5" value={form.headline} onChange={(e) => update("headline", e.target.value)} required />
            {errors.headline && <p className="mt-1 text-xs text-red-400">{errors.headline}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="bio">بیوگرافی</Label>
          <Textarea id="bio" className="mt-1.5" rows={6} value={form.bio} onChange={(e) => update("bio", e.target.value)} required />
          {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="avatarUrl">آدرس تصویر پروفایل</Label>
            <Input id="avatarUrl" dir="ltr" className="mt-1.5" value={form.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="resumeFileUrl">آدرس فایل رزومه</Label>
            <Input id="resumeFileUrl" dir="ltr" className="mt-1.5" value={form.resumeFileUrl} onChange={(e) => update("resumeFileUrl", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="email">ایمیل</Label>
            <Input id="email" type="email" dir="ltr" className="mt-1.5" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">تلفن</Label>
            <Input id="phone" dir="ltr" className="mt-1.5" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="location">محل سکونت</Label>
            <Input id="location" className="mt-1.5" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="availability">وضعیت در دسترس بودن</Label>
            <Input id="availability" className="mt-1.5" value={form.availability} onChange={(e) => update("availability", e.target.value)} placeholder="آماده همکاری" />
          </div>
          <div>
            <Label htmlFor="yearsExperience">سابقه کاری (سال)</Label>
            <Input id="yearsExperience" type="number" min={0} className="mt-1.5" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} />
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium text-muted">شبکه‌های اجتماعی</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="github">گیت‌هاب</Label>
              <Input id="github" dir="ltr" className="mt-1.5" value={form.github} onChange={(e) => update("github", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="linkedin">لینکدین</Label>
              <Input id="linkedin" dir="ltr" className="mt-1.5" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="twitter">توییتر</Label>
              <Input id="twitter" dir="ltr" className="mt-1.5" value={form.twitter} onChange={(e) => update("twitter", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="instagram">اینستاگرام</Label>
              <Input id="instagram" dir="ltr" className="mt-1.5" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="telegram">تلگرام</Label>
              <Input id="telegram" dir="ltr" className="mt-1.5" value={form.telegram} onChange={(e) => update("telegram", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره پروفایل"}
        </Button>
      </form>
    </Card>
  );
}
