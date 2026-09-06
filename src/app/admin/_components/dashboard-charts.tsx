"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DaySeriesPoint } from "../_lib/dashboard-data";

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(d);
}

export function TrendAreaChart({
  data,
  color = "#e11d2e",
  valueFormatter,
}: {
  data: DaySeriesPoint[];
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const gradientId = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDayLabel}
          tick={{ fill: "#9a9aa5", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "#9a9aa5", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) => (valueFormatter ? valueFormatter(v) : String(v))}
        />
        <Tooltip
          contentStyle={{
            background: "#16161c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(l) => formatDayLabel(String(l))}
          formatter={(value: number) => [valueFormatter ? valueFormatter(value) : value, ""]}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
