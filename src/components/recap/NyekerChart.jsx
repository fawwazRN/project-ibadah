import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Tip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-soft shadow-card px-3 py-2 border border-line rounded-lg">
      <p className="text-[11px] text-fg-2">{label}</p>
      <p className="font-display font-semibold text-brand-dim text-sm">
        {payload[0].value}{" "}
        <span className="font-normal text-fg-2 text-xs">{unit}</span>
      </p>
    </div>
  );
}

// Nyeker per hari (data = [{ label, total }])
export function NyekerPerDayChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-line)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<Tip unit="nyeker" />}
          cursor={{ fill: "rgba(15,23,42,.04)" }}
        />
        <Bar
          dataKey="total"
          fill="var(--color-brand)"
          radius={[4, 4, 0, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Santri dengan catatan terbanyak (horizontal)
export function TopStudentsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-line)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-line)" }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fill: "var(--color-fg-3)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-line)" }}
        />
        <Tooltip
          content={<Tip unit="nyeker" />}
          cursor={{ fill: "rgba(15,23,42,.04)" }}
        />
        <Bar
          dataKey="total"
          fill="var(--color-brand)"
          radius={[0, 4, 4, 0]}
          barSize={13}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
