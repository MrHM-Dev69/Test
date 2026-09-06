import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintButtonClient } from "./print-button";

export const metadata: Metadata = {
  title: "رزومه",
  description: "رزومه کامل قابل دانلود و چاپ.",
};

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function ResumePage() {
  const [profile, skills, experiences, education, certificates] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.educationItem.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.certificate.findMany({ orderBy: [{ order: "asc" }, { issueDate: "desc" }] }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 print:max-w-none print:px-0 print:py-4">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <h1 className="text-3xl font-bold">رزومه</h1>
        <div className="flex gap-3">
          {profile?.resumeFileUrl && (
            <Button asChild>
              <a href={profile.resumeFileUrl} target="_blank" rel="noopener noreferrer">
                دانلود فایل رزومه
              </a>
            </Button>
          )}
          <PrintButtonClient />
        </div>
      </div>

      {!profile && <p className="text-muted">اطلاعات پروفایل هنوز ثبت نشده است.</p>}

      {profile && (
        <div className="glass-surface p-8 print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          <header className="mb-8 border-b border-border pb-6 print:border-black">
            <h2 className="text-2xl font-bold">{profile.fullName}</h2>
            <p className="mt-1 text-accent">{profile.headline}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {profile.email && <span dir="ltr">{profile.email}</span>}
              {profile.phone && <span dir="ltr">{profile.phone}</span>}
              {profile.location && <span>{profile.location}</span>}
            </div>
          </header>

          <section className="mb-8">
            <h3 className="mb-3 text-lg font-semibold text-accent">درباره من</h3>
            <p className="whitespace-pre-line leading-7 text-muted">{profile.bio}</p>
          </section>

          {experiences.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-accent">سوابق کاری</h3>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold">
                        {exp.role} — {exp.company}
                      </p>
                      <p className="text-xs text-muted">
                        {formatFa(exp.startDate)} — {exp.isCurrent ? "اکنون" : exp.endDate ? formatFa(exp.endDate) : ""}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-accent">تحصیلات</h3>
              <div className="space-y-3">
                {education.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      {item.degree} — {item.institution}
                    </p>
                    <p className="text-xs text-muted">
                      {formatFa(item.startDate)} — {item.isCurrent ? "در حال تحصیل" : item.endDate ? formatFa(item.endDate) : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {skills.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-accent">مهارت‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {certificates.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-semibold text-accent">گواهینامه‌ها</h3>
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">
                      {cert.title} — {cert.issuer}
                    </p>
                    <p className="text-xs text-muted">{formatFa(cert.issueDate)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
