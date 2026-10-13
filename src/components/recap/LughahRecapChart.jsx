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
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-line)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(15,23,42,.04)" }}
          contentStyle={{
            background: "#ffffff",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "var(--color-fg-3)", fontSize: 11 }}
          itemStyle={{ color: "var(--color-brand-dim)" }}
        />
        <Bar
          dataKey="total"
          fill="var(--color-brand)"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
