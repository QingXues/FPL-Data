"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PlayerContributionChart({
  data,
}: {
  data: { name: string; points: number }[];
}) {
  const chartHeight = Math.max(320, data.length * 28);

  return (
    <div className="min-h-80 w-full min-w-0" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#9ca3af"
            fontSize={12}
            interval={0}
            tickLine={false}
            tickMargin={8}
            width={150}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", fontSize: 12 }}
          />
          <Bar dataKey="points" fill="#37003c" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
