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

// Warna mengikuti aksen peran (var(--color-brand)) & token skin — tidak ada hex gelap.
const BRAND = "var(--color-brand)";
const GRID = "var(--color-line)";
const AXIS = {
  tick: { fill: "var(--color-fg-3)", fontSize: 11, fontWeight: 600 },
  tickLine: false,
  axisLine: { stroke: GRID },
};

function TooltipBox({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card shadow-lg px-3 py-2 border border-line rounded-xl">
      <p className="text-[11px] text-fg-3">{label}</p>
      <p className="font-display font-extrabold text-fg text-sm">
        {payload[0].value}{" "}
        <span className="font-medium text-fg-3 text-xs">{unit}</span>
      </p>
    </div>
  );
}

export function AreaPerDay({ data, unit = "pelanggaran", height = 230 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
        <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          content={<TooltipBox unit={unit} />}
          cursor={{ stroke: "var(--color-line-2)" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={BRAND}
          strokeWidth={2.5}
          fill="url(#areaFill)"
          dot={false}
          activeDot={{ r: 4, fill: BRAND, strokeWidth: 0 }}
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
        <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 4" />
        <XAxis type="number" allowDecimals={false} {...AXIS} />
        <YAxis type="category" dataKey="name" width={150} {...AXIS} />
        <Tooltip
          content={<TooltipBox unit="kejadian" />}
          cursor={{ fill: "rgba(15,23,42,.04)" }}
        />
        <Bar dataKey="total" fill={BRAND} radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BarsWeekly({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          content={<TooltipBox unit="pelanggaran" />}
          cursor={{ fill: "rgba(15,23,42,.04)" }}
        />
        <Bar dataKey="total" fill={BRAND} radius={[6, 6, 0, 0]} barSize={22} />
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
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip content={<TooltipBox unit="pelanggaran" />} />
        <Line
          type="monotone"
          dataKey="total"
          stroke={BRAND}
          strokeWidth={2.5}
          dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
