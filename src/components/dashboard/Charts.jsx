import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AXIS = {
  tick: { fill: "#64748B", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,.08)" },
};

function TooltipBox({ active, payload, label, unit }) {
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

export function AreaPerDay({ data, unit = "pelanggaran" }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          content={<TooltipBox unit={unit} />}
          cursor={{ stroke: "rgba(255,255,255,.12)" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#34D399"
          strokeWidth={2}
          fill="#34D399"
          fillOpacity={0.07}
          dot={false}
          activeDot={{ r: 3, fill: "#34D399", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsByRule({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.05)" />
        <XAxis type="number" allowDecimals={false} {...AXIS} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          {...AXIS}
          tick={{ fill: "#94A3B8", fontSize: 11 }}
        />
        <Tooltip
          content={<TooltipBox unit="kejadian" />}
          cursor={{ fill: "rgba(255,255,255,.03)" }}
        />
        <Bar
          dataKey="total"
          fill="#10B981"
          radius={[0, 4, 4, 0]}
          barSize={13}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BarsWeekly({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          content={<TooltipBox unit="pelanggaran" />}
          cursor={{ fill: "rgba(255,255,255,.03)" }}
        />
        <Bar
          dataKey="total"
          fill="#14B8A6"
          radius={[4, 4, 0, 0]}
          barSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineMonthly({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip content={<TooltipBox unit="pelanggaran" />} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#2DD4BF"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#2DD4BF", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
