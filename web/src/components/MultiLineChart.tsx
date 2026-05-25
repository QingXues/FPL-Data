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
    <div className="h-72 min-h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="event" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} reversed={yReversed} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
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
