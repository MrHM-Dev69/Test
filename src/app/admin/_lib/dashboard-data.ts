import "server-only";
import { prisma } from "@/lib/prisma";

export interface DaySeriesPoint {
  date: string; // yyyy-mm-dd
  value: number;
}

function last30DaysSkeleton(): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  return map;
}

function fillSeries(rows: { day: Date; value: bigint | number }[]): DaySeriesPoint[] {
  const skeleton = last30DaysSkeleton();
  for (const row of rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    if (skeleton.has(key)) skeleton.set(key, Number(row.value));
  }
  return Array.from(skeleton.entries()).map(([date, value]) => ({ date, value }));
}

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getDashboardData() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    revenueThisMonth,
    revenueLastMonth,
    ordersByStatus,
    customersCount,
    productsTotal,
    productsPublished,
    coursesCount,
    studentsDistinct,
    activeProjects,
    pendingProjects,
    recentOrders,
    recentCustomers,
    recentProjects,
    revenueSeriesRaw,
    ordersSeriesRaw,
    enrollmentSeriesRaw,
    activityFeed,
    failedLogins,
    securityAuditLogs,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "INCOME", occurredAt: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", occurredAt: { gte: lastMonthStart, lt: thisMonthStart } },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count({ where: { role: { name: "CUSTOMER" } } }),
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.course.count(),
    prisma.enrollment.findMany({ distinct: ["userId"], select: { userId: true } }),
    prisma.projectRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.projectRequest.count({ where: { status: "NEW" } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
    }),
    prisma.user.findMany({
      where: { role: { name: "CUSTOMER" } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectRequest.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    prisma.$queryRaw<{ day: Date; value: bigint }[]>`
      SELECT date_trunc('day', "occurredAt") AS day, COALESCE(SUM(amount), 0) AS value
      FROM "Transaction"
      WHERE type = 'INCOME' AND "occurredAt" >= ${thirtyDaysAgo}
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<{ day: Date; value: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS value
      FROM "Order"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<{ day: Date; value: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS value
      FROM "Enrollment"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY 1 ORDER BY 1
    `,
    prisma.auditLog.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { user: true } }),
    prisma.loginHistory.findMany({
      where: { success: false },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: "2FA", mode: "insensitive" } },
          { action: { contains: "PASSWORD", mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  const revenueThisMonthNum = Number(revenueThisMonth._sum.amount ?? 0);
  const revenueLastMonthNum = Number(revenueLastMonth._sum.amount ?? 0);
  const revenueChangePct =
    revenueLastMonthNum > 0
      ? ((revenueThisMonthNum - revenueLastMonthNum) / revenueLastMonthNum) * 100
      : revenueThisMonthNum > 0
        ? 100
        : 0;

  const ordersTotal = ordersByStatus.reduce((sum, r) => sum + r._count._all, 0);

  return {
    kpi: {
      revenueThisMonth: revenueThisMonthNum,
      revenueLastMonth: revenueLastMonthNum,
      revenueChangePct,
      ordersTotal,
      ordersByStatus: ordersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      customersCount,
      productsTotal,
      productsPublished,
      productsDraft: productsTotal - productsPublished,
      coursesCount,
      studentsCount: studentsDistinct.length,
      activeProjects,
      pendingProjects,
    },
    recentOrders,
    recentCustomers,
    recentProjects,
    charts: {
      revenue: fillSeries(revenueSeriesRaw),
      orders: fillSeries(ordersSeriesRaw),
      enrollments: fillSeries(enrollmentSeriesRaw),
    },
    activityFeed,
    securityEvents: {
      failedLogins,
      auditLogs: securityAuditLogs,
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
