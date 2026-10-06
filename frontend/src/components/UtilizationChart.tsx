import { useState, useMemo, useId } from 'react';
import { useSimStore } from '../store/useSimStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  type TooltipProps,
} from 'recharts';
import { TrendingUp, Layers, BarChart2 } from 'lucide-react';
import { CHART } from '../lib/colors';

type ChartMode = 'utilization' | 'queues' | 'processes';

const MODES: { id: ChartMode; label: string }[] = [
  { id: 'utilization', label: 'Utilization' },
  { id: 'queues', label: 'Queues' },
  { id: 'processes', label: 'Processes' },
];

const MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';

// CPU and disk are busy/idle per tick (0 or 100); average them over this many ticks for display
const SMOOTH_WINDOW = 5;

// The current-tick marker is ink, same as the Gantt chart's
const MARKER = CHART.tooltipText;

const AXIS_TICK = { fill: CHART.axis, fontSize: 11, fontFamily: MONO };
const CHART_MARGIN = { top: 22, right: 8, bottom: 0, left: 0 };

interface SeriesDef {
  key: string;
  label: string;
  color: string;
  format: (v: number) => string;
}

const pct = (v: number) => `${Math.round(v)}%`;
const count = (v: number) => `${v}`;
const ticks = (v: number) => `${v} ticks`;

const UTIL_SERIES: SeriesDef[] = [
  { key: 'cpuAvg', label: 'CPU', color: CHART.cpu, format: pct },
  { key: 'ram', label: 'RAM', color: CHART.ram, format: pct },
  { key: 'ioAvg', label: 'Disk I/O', color: CHART.disk, format: pct },
];

const QUEUE_SERIES: SeriesDef[] = [
  { key: 'readyQueue', label: 'Ready queue', color: CHART.ready, format: count },
  { key: 'ioQueue', label: 'Waiting I/O', color: CHART.io, format: count },
  { key: 'memQueue', label: 'Page fault wait', color: CHART.mem, format: count },
];

const PROCESS_SERIES: SeriesDef[] = [
  { key: 'turnaround', label: 'Turnaround time', color: CHART.cpu, format: ticks },
  { key: 'waitTime', label: 'Wait time', color: CHART.disk, format: ticks },
];

const SERIES_BY_MODE: Record<ChartMode, SeriesDef[]> = {
  utilization: UTIL_SERIES,
  queues: QUEUE_SERIES,
  processes: PROCESS_SERIES,
};

/** '#RRGGBB' from colors.ts -> rgba() with the given alpha */
function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Centered moving average over `window` entries (shrinks at the edges) */
function movingAverage(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  const prefix = [0];
  for (const v of values) prefix.push(prefix[prefix.length - 1] + v);
  return values.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length - 1, i + half);
    return (prefix[hi + 1] - prefix[lo]) / (hi - lo + 1);
  });
}

// ---------- Tooltip ----------

interface ChartTooltipProps extends TooltipProps<number, string> {
  series: SeriesDef[];
  labelFormat: (label: unknown) => string;
}

function ChartTooltip({ active, payload, label, series, labelFormat }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const byKey = new Map(series.map((s) => [s.key, s]));
  return (
    <div className="min-w-[148px] rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <div className="mb-1.5 font-mono text-muted tabular-nums">{labelFormat(label)}</div>
      <ul className="space-y-1">
        {payload.map((item) => {
          const def = byKey.get(String(item.dataKey));
          if (!def) return null;
          return (
            <li key={def.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: def.color }}
              />
              <span className="text-muted">{def.label}</span>
              <span className="ml-auto pl-3 font-medium text-ink tabular-nums">
                {def.format(Number(item.value ?? 0))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Current-tick marker label ----------

interface MarkerLabelProps {
  viewBox?: { x?: number; y?: number };
  tick: number;
  /** 0..1 position of the tick along the x domain, used to keep the label inside the chart */
  fraction: number;
}

function MarkerLabel({ viewBox, tick, fraction }: MarkerLabelProps) {
  if (!viewBox || viewBox.x === undefined || viewBox.y === undefined) return null;
  const text = `T=${tick}`;
  const w = text.length * 6.8 + 8;
  const h = 16;
  // Anchor the pill to the left of the line near the right edge, to the right near the left edge
  let left = viewBox.x - w / 2;
  if (fraction > 0.8) left = viewBox.x - w + 0.5;
  else if (fraction < 0.2) left = viewBox.x - 0.5;
  const top = viewBox.y - h - 3;
  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={4}
        fill={CHART.tooltipBg}
        stroke={CHART.tooltipBorder}
      />
      <text
        x={left + w / 2}
        y={top + h / 2}
        dy="0.35em"
        textAnchor="middle"
        fill={MARKER}
        fontSize={11}
        fontFamily={MONO}
        fontWeight={500}
      >
        {text}
      </text>
    </g>
  );
}

// ---------- Series toggle chips ----------

function SeriesChips({
  series,
  hidden,
  onToggle,
}: {
  series: SeriesDef[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="แสดงหรือซ่อนเส้นข้อมูล">
      {series.map((s) => {
        const on = !hidden.has(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onToggle(s.key)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              on ? 'text-ink' : 'border-line bg-surface text-subtle hover:border-line-strong hover:text-muted'
            }`}
            style={on ? { backgroundColor: withAlpha(s.color, 0.1), borderColor: withAlpha(s.color, 0.35) } : undefined}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full border-[1.5px]"
              style={{ borderColor: s.color, backgroundColor: on ? s.color : 'transparent' }}
            />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Component ----------

export default function UtilizationChart() {
  const { result, currentTick } = useSimStore();
  const [chartMode, setChartMode] = useState<ChartMode>('utilization');
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const gradientPrefix = `uc${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // Timeline Data for Utilization and Queue depths
  const timelineData = useMemo(() => {
    if (!result || !result.snapshots) return [];

    // Smooth CPU/disk busy flags over neighbouring ticks before sampling, so the window is in ticks
    const cpuAvg = movingAverage(result.snapshots.map((s) => (s.cpu_busy ? 100 : 0)), SMOOTH_WINDOW);
    const ioAvg = movingAverage(result.snapshots.map((s) => (s.disk_busy ? 100 : 0)), SMOOTH_WINDOW);

    // Sample if snapshots are very large (> 200 ticks) so graph renders fast and smooth
    const step = Math.max(1, Math.floor(result.snapshots.length / 160));
    const points = [];

    for (let i = 0; i < result.snapshots.length; i += step) {
      const snap = result.snapshots[i];
      const totalFrames = snap.frames.length || 1;
      const ramUsed = (snap.frames.filter(f => f !== null).length / totalFrames) * 100;

      points.push({
        tick: snap.t,
        cpu: snap.cpu_busy ? 100 : 0,
        cpuAvg: Math.round(cpuAvg[i]),
        ram: Math.round(ramUsed),
        io: snap.disk_busy ? 100 : 0,
        ioAvg: Math.round(ioAvg[i]),
        readyQueue: snap.ready.length,
        ioQueue: snap.waiting_io.length,
        memQueue: snap.waiting_mem.length,
      });
    }
    return points;
  }, [result]);

  // Per Process Bar Chart Data (Turnaround vs Wait Time)
  const processData = useMemo(() => {
    if (!result || !result.metrics || !result.metrics.per_process) return [];
    return result.metrics.per_process.map((p: any) => ({
      name: `P${p.pid}`,
      turnaround: p.turnaround ?? 0,
      waitTime: p.wait_time ?? 0,
      pageFaults: p.page_faults ?? 0,
    }));
  }, [result]);

  if (!result || timelineData.length === 0) return null;

  const toggleSeries = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const firstTick = timelineData[0].tick;
  const lastTick = timelineData[timelineData.length - 1].tick;
  const markerFraction = lastTick > firstTick ? (currentTick - firstTick) / (lastTick - firstTick) : 0.5;

  const tickLabel = (v: unknown) => `T+${v}`;
  const activeSeries = SERIES_BY_MODE[chartMode];

  // Shared pieces for the two timeline charts (utilization + queues)
  const renderTimelineChrome = (series: SeriesDef[], yProps: Record<string, unknown>) => [
    <defs key="defs">
      {series.map((s) => (
        <linearGradient key={s.key} id={`${gradientPrefix}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.color} stopOpacity={0.08} />
          <stop offset="100%" stopColor={s.color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>,
    <CartesianGrid key="grid" stroke={CHART.grid} vertical={false} />,
    <XAxis
      key="x"
      dataKey="tick"
      type="number"
      domain={['dataMin', 'dataMax']}
      allowDecimals={false}
      tick={AXIS_TICK}
      axisLine={false}
      tickLine={false}
      tickMargin={6}
      minTickGap={24}
      tickFormatter={tickLabel}
    />,
    <YAxis key="y" tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} {...yProps} />,
    <Tooltip
      key="tooltip"
      content={<ChartTooltip series={series} labelFormat={tickLabel} />}
      cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: '3 3' }}
      isAnimationActive={false}
    />,
    <ReferenceLine
      key="marker"
      x={currentTick}
      stroke={MARKER}
      strokeWidth={1}
      strokeOpacity={0.75}
      ifOverflow="hidden"
      label={(props: any) => <MarkerLabel viewBox={props.viewBox} tick={currentTick} fraction={markerFraction} />}
    />,
    ...series
      .filter((s) => !hidden.has(s.key))
      .map((s) => (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          strokeWidth={2}
          fill={`url(#${gradientPrefix}-${s.key})`}
          fillOpacity={1}
          dot={false}
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: CHART.tooltipBg, fill: s.color }}
          isAnimationActive={false}
        />
      )),
  ];

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header with Chart Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            {chartMode === 'utilization' && <TrendingUp className="text-muted" size={16} />}
            {chartMode === 'queues' && <Layers className="text-muted" size={16} />}
            {chartMode === 'processes' && <BarChart2 className="text-muted" size={16} />}
            {chartMode === 'utilization' && 'การใช้ทรัพยากรตามเวลา'}
            {chartMode === 'queues' && 'ความยาวคิวตามเวลา'}
            {chartMode === 'processes' && 'เปรียบเทียบรายโปรเซส'}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {chartMode === 'utilization' && 'เปอร์เซ็นต์การใช้ CPU, RAM และดิสก์ในแต่ละ tick'}
            {chartMode === 'queues' && 'จำนวน process ใน ready queue, ที่รอดิสก์ และที่รอหน่วยความจำ'}
            {chartMode === 'processes' && 'Turnaround time เทียบกับ wait time ของแต่ละ process'}
          </p>
        </div>

        {/* Mode switcher */}
        <div className="self-start flex items-center bg-surface-muted p-1 rounded-lg">
          {MODES.map((m) => {
            const selected = chartMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setChartMode(m.id)}
                aria-pressed={selected}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selected ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <SeriesChips series={activeSeries} hidden={hidden} onToggle={toggleSeries} />

        {/* Chart Canvas Area */}
        <div className="h-52 w-full">
          {chartMode === 'utilization' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={CHART_MARGIN}>
                {renderTimelineChrome(UTIL_SERIES, {
                  domain: [0, 100],
                  ticks: [0, 50, 100],
                  tickFormatter: (v: number) => `${v}%`,
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'queues' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={CHART_MARGIN}>
                {renderTimelineChrome(QUEUE_SERIES, { allowDecimals: false })}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'processes' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData} margin={{ ...CHART_MARGIN, top: 8 }} barGap={4} barCategoryGap="24%">
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                />
                <YAxis
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  allowDecimals={false}
                  tickFormatter={(v: number) => `${v} t`}
                />
                <Tooltip
                  content={<ChartTooltip series={PROCESS_SERIES} labelFormat={String} />}
                  cursor={{ fill: CHART.grid, fillOpacity: 0.5 }}
                  isAnimationActive={false}
                />
                {PROCESS_SERIES.filter((s) => !hidden.has(s.key)).map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    animationDuration={300}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {chartMode === 'utilization' && (
          <p className="text-xs text-muted">CPU และ Disk แสดงค่าเฉลี่ย {SMOOTH_WINDOW} tick</p>
        )}
      </div>
    </section>
  );
}
