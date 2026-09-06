import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "گواهینامه‌های من" };

export default async function MyCertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy/my/certificates");

  const certificates = await prisma.certificate2.findMany({
    where: { enrollment: { userId: user.id } },
    include: { enrollment: { include: { course: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">گواهینامه‌های من</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.map((cert) => (
          <Card key={cert.id} className="border-2 border-accent/30 text-center">
            <CardContent className="space-y-3 pt-6">
              <p className="text-xs uppercase text-muted">گواهینامه پایان دوره</p>
              <h2 className="text-lg font-bold text-foreground">{cert.enrollment.course.title}</h2>
              <p className="text-sm text-muted">
                صادر شده به {user.name ?? "دانشجو"} در تاریخ{" "}
                {new Intl.DateTimeFormat("fa-IR").format(cert.issuedAt)}
              </p>
              <p className="font-mono text-xs text-muted">شماره سریال: {cert.serialNumber}</p>
              <a
                href={`/academy/my/certificates/${cert.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-accent hover:underline"
              >
                چاپ / دانلود
              </a>
            </CardContent>
          </Card>
        ))}
        {certificates.length === 0 && <p className="text-muted">هنوز گواهینامه‌ای دریافت نکرده‌اید.</p>}
      </div>
    </div>
  );
}
