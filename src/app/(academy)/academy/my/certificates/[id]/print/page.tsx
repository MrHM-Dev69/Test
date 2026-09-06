import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/academy/my/certificates`);

  const certificate = await prisma.certificate2.findUnique({
    where: { id },
    include: { enrollment: { include: { course: true } } },
  });
  if (!certificate || certificate.enrollment.userId !== user.id) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8 print:p-0" dir="rtl">
      <div className="w-full max-w-3xl border-8 border-double border-red-700 p-16 text-center text-black">
        <p className="mb-2 text-sm tracking-widest text-gray-500">گواهینامه پایان دوره</p>
        <h1 className="mb-6 text-4xl font-bold">آکادمی برند شخصی</h1>
        <p className="mb-4 text-lg">این گواهی تایید می‌کند که</p>
        <p className="mb-4 text-3xl font-bold text-red-700">{user.name ?? "دانشجو"}</p>
        <p className="mb-4 text-lg">دوره</p>
        <p className="mb-6 text-2xl font-semibold">{certificate.enrollment.course.title}</p>
        <p className="mb-8 text-lg">را با موفقیت به پایان رسانده است.</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>تاریخ صدور: {new Intl.DateTimeFormat("fa-IR").format(certificate.issuedAt)}</span>
          <span className="font-mono">شماره سریال: {certificate.serialNumber}</span>
        </div>
      </div>
    </div>
  );
}
