import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { ensureCsrfCookie } from "@/lib/security/csrf";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "تماس با من",
  description: "فرم تماس برای درخواست همکاری، پروژه یا سوال.",
};

export default async function ContactPage() {
  // Ensures the readable CSRF cookie exists before the client form submits.
  await ensureCsrfCookie();
  const profile = await prisma.profile.findFirst();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">تماس با من</h1>
      <div className="grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-3">
          <ContactForm />
        </Card>
        <div className="space-y-4 md:col-span-2">
          <Card>
            <CardTitle>اطلاعات تماس</CardTitle>
            <div className="mt-3 space-y-2 text-sm text-muted">
              {profile?.email && <p dir="ltr">{profile.email}</p>}
              {profile?.phone && <p dir="ltr">{profile.phone}</p>}
              {profile?.location && <p>{profile.location}</p>}
              {!profile?.email && !profile?.phone && !profile?.location && (
                <p>اطلاعات تماس هنوز ثبت نشده است.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
