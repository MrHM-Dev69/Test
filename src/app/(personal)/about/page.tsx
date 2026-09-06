import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "درباره من",
  description: "بیوگرافی، تحصیلات و گواهینامه‌های حرفه‌ای.",
};

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function AboutPage() {
  const [profile, education, certificates] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.educationItem.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.certificate.findMany({ orderBy: [{ order: "asc" }, { issueDate: "desc" }] }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold">درباره من</h1>

      {profile ? (
        <>
          <p className="whitespace-pre-line leading-8 text-muted">{profile.bio}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {profile.location && (
              <div>
                <dt className="text-muted">محل سکونت</dt>
                <dd>{profile.location}</dd>
              </div>
            )}
            {profile.yearsExperience != null && (
              <div>
                <dt className="text-muted">سابقه کاری</dt>
                <dd>{profile.yearsExperience} سال</dd>
              </div>
            )}
            {profile.email && (
              <div>
                <dt className="text-muted">ایمیل</dt>
                <dd dir="ltr">{profile.email}</dd>
              </div>
            )}
          </dl>
        </>
      ) : (
        <p className="text-muted">اطلاعات پروفایل هنوز ثبت نشده است.</p>
      )}

      <h2 className="mb-6 mt-14 text-2xl font-bold">تحصیلات</h2>
      {education.length === 0 ? (
        <p className="text-muted">موردی ثبت نشده است.</p>
      ) : (
        <ol className="relative border-r-2 border-border pr-6">
          {education.map((item) => (
            <li key={item.id} className="mb-8">
              <span className="absolute -right-[9px] mt-1.5 h-4 w-4 rounded-full bg-accent glow-accent" />
              <p className="text-sm text-muted">
                {formatFa(item.startDate)} — {item.isCurrent ? "در حال تحصیل" : item.endDate ? formatFa(item.endDate) : ""}
              </p>
              <h3 className="text-lg font-semibold">{item.degree}</h3>
              <p className="text-accent">
                {item.institution}
                {item.fieldOfStudy ? ` — ${item.fieldOfStudy}` : ""}
              </p>
              {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
            </li>
          ))}
        </ol>
      )}

      <h2 className="mb-6 mt-14 text-2xl font-bold">گواهینامه‌ها</h2>
      {certificates.length === 0 ? (
        <p className="text-muted">موردی ثبت نشده است.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardTitle>{cert.title}</CardTitle>
              <p className="mt-1 text-sm text-muted">{cert.issuer}</p>
              <p className="mt-2 text-xs text-muted">صادر شده در {formatFa(cert.issueDate)}</p>
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} className="mt-2 inline-block text-sm text-accent hover:underline">
                  مشاهده گواهینامه
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
