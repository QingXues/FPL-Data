"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RankChart({ data }: { data: { event: number; rank: number | null }[] }) {
  const reversedData = [...data].reverse();
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={reversedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="event" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" reversed />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f1f5f9" }}
          />
          <Line type="monotone" dataKey="rank" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
