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
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={reversedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="event" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} reversed />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="rank" stroke="#e90052" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
