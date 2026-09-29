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
    <div className="bg-ink-800/95 shadow-card px-3 py-2 border border-white/10 rounded-lg">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-display font-semibold text-brand-soft text-sm">
        {payload[0].value}{" "}
        <span className="font-normal text-slate-400 text-xs">{unit}</span>
      </p>
    </div>
  );
}

// Nyeker per hari (data = [{ label, total }])
export function NyekerPerDayChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<Tip unit="nyeker" />}
          cursor={{ fill: "rgba(255,255,255,.03)" }}
        />
        <Bar
          dataKey="total"
          fill="#10B981"
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
        <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.05)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
        />
        <Tooltip
          content={<Tip unit="nyeker" />}
          cursor={{ fill: "rgba(255,255,255,.03)" }}
        />
        <Bar
          dataKey="total"
          fill="#14B8A6"
          radius={[0, 4, 4, 0]}
          barSize={13}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
