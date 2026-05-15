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
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={120} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", fontSize: 12 }}
          />
          <Bar dataKey="points" fill="#37003c" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
