"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">داده‌ای برای نمایش وجود ندارد.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={11} />
          <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
          <Tooltip
            contentStyle={{ background: "#0f0f13", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }}
            labelStyle={{ color: "#f5f5f7" }}
            formatter={(value) => [`${Number(value).toLocaleString("fa-IR")} تومان`, "درآمد"]}
          />
          <Line type="monotone" dataKey="revenue" stroke="#e11d2e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
