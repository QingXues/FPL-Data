"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function MultiLineChart({
  data,
  lines,
  yReversed = false,
}: {
  data: Record<string, number | string>[];
  lines: { key: string; color: string; name: string }[];
  yReversed?: boolean;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="event" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" reversed={yReversed} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f1f5f9" }}
          />
          <Legend />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              name={l.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
