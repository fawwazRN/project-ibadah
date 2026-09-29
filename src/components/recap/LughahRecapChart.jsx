import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function LughahRecapChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,.03)" }}
          contentStyle={{
            background: "#101a2c",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#94A3B8", fontSize: 11 }}
          itemStyle={{ color: "#34D399" }}
        />
        <Bar
          dataKey="total"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
