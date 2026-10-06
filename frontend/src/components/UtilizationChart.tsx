import { useState, useMemo, type CSSProperties } from 'react';
import { useSimStore } from '../store/useSimStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
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

// The current-tick marker is ink, same as the Gantt chart's
const MARKER = CHART.tooltipText;

const AXIS_TICK = { fill: CHART.axis, fontSize: 11, fontFamily: MONO };
const AXIS_LINE = { stroke: CHART.grid };

const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: '6px',
  boxShadow: '0 12px 32px -8px rgb(var(--ink) / 0.18), 0 2px 6px rgb(var(--ink) / 0.06)',
  fontSize: '12px',
  color: CHART.tooltipText,
  padding: '8px 12px',
};
const TOOLTIP_LABEL_STYLE: CSSProperties = { color: CHART.tooltipText, fontWeight: 600, marginBottom: 2 };

const LEGEND_STYLE: CSSProperties = { fontSize: '12px', paddingBottom: '8px' };

const markerLabel = (tick: number) => ({
  value: `T=${tick}`,
  fill: MARKER,
  fontSize: 11,
  position: 'top' as const,
  fontFamily: MONO,
});

export default function UtilizationChart() {
  const { result, currentTick } = useSimStore();
  const [chartMode, setChartMode] = useState<ChartMode>('utilization');

  // Timeline Data for Utilization and Queue depths
  const timelineData = useMemo(() => {
    if (!result || !result.snapshots) return [];

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
        ram: Math.round(ramUsed),
        io: snap.disk_busy ? 100 : 0,
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

      {/* Chart Canvas Area */}
      <div className="h-52 w-full pt-1">
        {chartMode === 'utilization' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="tick"
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
                tickFormatter={(v) => `T+${v}`}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                cursor={{ stroke: CHART.grid }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    cpu: 'CPU util',
                    ram: 'RAM util',
                    io: 'Disk I/O',
                  };
                  return [`${value}%`, labelMap[name] || name];
                }}
                labelFormatter={(label) => `T+${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={LEGEND_STYLE}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    cpu: 'CPU',
                    ram: 'RAM',
                    io: 'Disk I/O',
                  };
                  return map[value] || value;
                }}
              />
              <ReferenceLine
                x={currentTick}
                stroke={MARKER}
                strokeDasharray="3 3"
                label={markerLabel(currentTick)}
              />
              <Line type="monotone" dataKey="cpu" stroke={CHART.cpu} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ram" stroke={CHART.ram} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="io" stroke={CHART.disk} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'queues' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="tick"
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
                tickFormatter={(v) => `T+${v}`}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                cursor={{ stroke: CHART.grid }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    readyQueue: 'Ready queue',
                    ioQueue: 'Waiting I/O',
                    memQueue: 'Page fault wait',
                  };
                  return [`${value}`, labelMap[name] || name];
                }}
                labelFormatter={(label) => `T+${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={LEGEND_STYLE}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    readyQueue: 'Ready',
                    ioQueue: 'Waiting I/O',
                    memQueue: 'Wait mem',
                  };
                  return map[value] || value;
                }}
              />
              <ReferenceLine
                x={currentTick}
                stroke={MARKER}
                strokeDasharray="3 3"
                label={markerLabel(currentTick)}
              />
              <Area type="monotone" dataKey="readyQueue" stroke={CHART.ready} fill={CHART.ready} fillOpacity={0.15} isAnimationActive={false} />
              <Area type="monotone" dataKey="ioQueue" stroke={CHART.io} fill={CHART.io} fillOpacity={0.15} isAnimationActive={false} />
              <Area type="monotone" dataKey="memQueue" stroke={CHART.mem} fill={CHART.mem} fillOpacity={0.15} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'processes' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processData}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} unit=" t" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                cursor={{ fill: CHART.grid, fillOpacity: 0.6 }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    turnaround: 'Turnaround time',
                    waitTime: 'Wait time',
                  };
                  return [`${value} ticks`, labelMap[name] || name];
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={LEGEND_STYLE}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    turnaround: 'Turnaround time',
                    waitTime: 'Wait time',
                  };
                  return map[value] || value;
                }}
              />
              <Bar dataKey="turnaround" fill={CHART.cpu} radius={[3, 3, 0, 0]} />
              <Bar dataKey="waitTime" fill={CHART.disk} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
