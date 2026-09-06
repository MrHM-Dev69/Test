import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "جدید",
  REVIEWING: "در حال بررسی",
  QUOTED: "قیمت‌گذاری شده",
  ACCEPTED: "پذیرفته شده",
  IN_PROGRESS: "در حال انجام",
  WAITING_FOR_CLIENT: "منتظر مشتری",
  COMPLETED: "تکمیل شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "کم",
  NORMAL: "عادی",
  HIGH: "بالا",
  URGENT: "فوری",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  NEW: "secondary",
  REVIEWING: "warning",
  QUOTED: "warning",
  ACCEPTED: "default",
  IN_PROGRESS: "default",
  WAITING_FOR_CLIENT: "warning",
  COMPLETED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; type?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return <Forbidden label="پروژه‌ها" />;

  const { status, priority, type } = await searchParams;

  const projects = await prisma.projectRequest.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(priority ? { priority: priority as never } : {}),
      ...(type ? { projectType: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const filterLink = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams({
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(type ? { type } : {}),
      ...patch,
    });
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k);
    const qs = params.toString();
    return `/admin/projects${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پروژه‌های سفارشی</h1>
        <p className="mt-1 text-sm text-muted">{projects.length.toLocaleString("fa-IR")} پروژه</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-muted">وضعیت:</span>
        <Link href={filterLink({ status: undefined })} className={!status ? "text-accent" : "text-muted"}>
          همه
        </Link>
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <Link key={k} href={filterLink({ status: k })} className={status === k ? "text-accent" : "text-muted"}>
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">درخواست‌دهنده</th>
                <th className="p-3 font-medium">نوع پروژه</th>
                <th className="p-3 font-medium">اولویت</th>
                <th className="p-3 font-medium">بودجه</th>
                <th className="p-3 font-medium">قیمت پیشنهادی</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    پروژه‌ای یافت نشد.
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="p-3">
                    <Link href={`/admin/projects/${p.id}`} className="text-accent hover:underline">
                      {p.contactName}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{p.projectType}</td>
                  <td className="p-3 text-muted">{PRIORITY_LABELS[p.priority] ?? p.priority}</td>
                  <td className="p-3 text-muted">{p.budgetRange}</td>
                  <td className="p-3">{p.quotedPrice ? formatToman(Number(p.quotedPrice)) : "—"}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_BADGE[p.status] ?? "secondary"}>{STATUS_LABELS[p.status] ?? p.status}</Badge>
                  </td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
