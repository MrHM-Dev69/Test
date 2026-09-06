import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToman } from "@/lib/utils";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";
import { getDashboardData } from "../_lib/dashboard-data";
import { TrendAreaChart } from "../_components/dashboard-charts";

export const dynamic = "force-dynamic";

// Cross-domain analytics overview — reuses the same real aggregate queries
// as the main dashboard (src/app/admin/_lib/dashboard-data.ts), presented
// with a focus on trend charts rather than the operational widgets.
export default async function AnalyticsPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "analytics.view")) return <Forbidden label="تحلیل و آمار" />;

  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تحلیل و آمار</h1>
        <p className="mt-1 text-sm text-muted">روندهای ۳۰ روز اخیر بر اساس داده‌های واقعی</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">درآمد این ماه</p>
            <p className="mt-2 text-xl font-bold">{formatToman(data.kpi.revenueThisMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">سفارش‌ها</p>
            <p className="mt-2 text-xl font-bold">{data.kpi.ordersTotal.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">مشتریان</p>
            <p className="mt-2 text-xl font-bold">{data.kpi.customersCount.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">دانشجویان</p>
            <p className="mt-2 text-xl font-bold">{data.kpi.studentsCount.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روند درآمد</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendAreaChart data={data.charts.revenue} color="#e11d2e" valueKind="toman" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>روند سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={data.charts.orders} color="#38bdf8" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>روند ثبت‌نام دوره‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={data.charts.enrollments} color="#34d399" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
