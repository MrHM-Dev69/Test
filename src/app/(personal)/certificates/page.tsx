import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "گواهینامه‌ها",
  description: "فهرست کامل گواهینامه‌ها و مدارک حرفه‌ای.",
};

function formatFa(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(date);
}

export default async function CertificatesPage() {
  const certificates = await prisma.certificate.findMany({
    orderBy: [{ order: "asc" }, { issueDate: "desc" }],
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">گواهینامه‌ها</h1>
      {certificates.length === 0 ? (
        <p className="text-muted">موردی ثبت نشده است.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              {cert.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cert.imageUrl} alt={cert.title} className="mb-3 h-32 w-full rounded-lg object-cover" />
              )}
              <CardTitle>{cert.title}</CardTitle>
              <p className="mt-1 text-sm text-muted">{cert.issuer}</p>
              <p className="mt-2 text-xs text-muted">
                صادر شده در {formatFa(cert.issueDate)}
                {cert.expiryDate ? ` — انقضا ${formatFa(cert.expiryDate)}` : ""}
              </p>
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
