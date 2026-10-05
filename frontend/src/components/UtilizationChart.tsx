import { useState, useMemo } from 'react';
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
  Tooltip, 
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendingUp, Layers, BarChart2 } from 'lucide-react';

export default function UtilizationChart() {
  const { result, currentTick } = useSimStore();
  const [chartMode, setChartMode] = useState<'utilization' | 'queues' | 'processes'>('utilization');

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
    <div className="bg-surface border border-border-subtle rounded-lg p-3.5 space-y-3 shadow-subtle">
      {/* Header with Chart Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-2.5">
        <div className="flex items-center space-x-2">
          {chartMode === 'utilization' && <TrendingUp className="text-blue-400" size={16} />}
          {chartMode === 'queues' && <Layers className="text-amber-400" size={16} />}
          {chartMode === 'processes' && <BarChart2 className="text-emerald-400" size={16} />}
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">
              {chartMode === 'utilization' && 'กราฟการใช้ทรัพยากรตามเวลา (Resource Telemetry Timeline)'}
              {chartMode === 'queues' && 'กราฟความลึกของคิวในระบบ (Queue Depths Timeline)'}
              {chartMode === 'processes' && 'การเปรียบเทียบประสิทธิภาพรายโปรเซส (Process Benchmark)'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              {chartMode === 'utilization' && 'CPU %, RAM % & DISK I/O UTILIZATION PROFILE'}
              {chartMode === 'queues' && 'READY, DISK WAIT & MEMORY WAIT PROCESS COUNTS'}
              {chartMode === 'processes' && 'TURNAROUND VS WAIT TIME METRICS PER PID'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setChartMode('utilization')}
            className={`px-3 py-1 rounded-lg text-xs transition font-medium ${
              chartMode === 'utilization' ? 'bg-white text-blue-700 font-bold shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Utilization
          </button>
          <button
            onClick={() => setChartMode('queues')}
            className={`px-3 py-1 rounded-lg text-xs transition font-medium ${
              chartMode === 'queues' ? 'bg-white text-blue-700 font-bold shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Queues
          </button>
          <button
            onClick={() => setChartMode('processes')}
            className={`px-3 py-1 rounded-lg text-xs transition font-medium ${
              chartMode === 'processes' ? 'bg-white text-blue-700 font-bold shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Processes
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-52 w-full pt-1">
        {chartMode === 'utilization' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <XAxis 
                dataKey="tick" 
                stroke="#4b5563" 
                fontSize={10} 
                tickFormatter={(v) => `T+${v}`}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} unit="%" fontFamily="JetBrains Mono, monospace" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#10141d', borderColor: '#1e2433', borderRadius: '6px', fontSize: '11px', color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    cpu: 'CPU Util',
                    ram: 'RAM Util',
                    io: 'Disk I/O',
                  };
                  return [`${value}%`, labelMap[name] || name];
                }}
                labelFormatter={(label) => `T+${label}`}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}
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
                stroke="#3b82f6" 
                strokeDasharray="3 3" 
                label={{ value: `T=${currentTick}`, fill: '#60a5fa', fontSize: 10, position: 'top', fontFamily: 'JetBrains Mono, monospace' }} 
              />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ram" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="io" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'queues' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <XAxis 
                dataKey="tick" 
                stroke="#4b5563" 
                fontSize={10} 
                tickFormatter={(v) => `T+${v}`}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis stroke="#4b5563" fontSize={10} allowDecimals={false} fontFamily="JetBrains Mono, monospace" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#10141d', borderColor: '#1e2433', borderRadius: '6px', fontSize: '11px', color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    readyQueue: 'Ready Queue',
                    ioQueue: 'Waiting I/O',
                    memQueue: 'Page Fault Wait',
                  };
                  return [`${value}`, labelMap[name] || name];
                }}
                labelFormatter={(label) => `T+${label}`}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    readyQueue: 'Ready',
                    ioQueue: 'Waiting I/O',
                    memQueue: 'Wait Mem',
                  };
                  return map[value] || value;
                }}
              />
              <ReferenceLine 
                x={currentTick} 
                stroke="#3b82f6" 
                strokeDasharray="3 3" 
                label={{ value: `T=${currentTick}`, fill: '#60a5fa', fontSize: 10, position: 'top', fontFamily: 'JetBrains Mono, monospace' }} 
              />
              <Area type="monotone" dataKey="readyQueue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} isAnimationActive={false} />
              <Area type="monotone" dataKey="ioQueue" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} isAnimationActive={false} />
              <Area type="monotone" dataKey="memQueue" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'processes' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processData}>
              <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontFamily="JetBrains Mono, monospace" />
              <YAxis stroke="#4b5563" fontSize={10} unit=" t" fontFamily="JetBrains Mono, monospace" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#10141d', borderColor: '#1e2433', borderRadius: '6px', fontSize: '11px', color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    turnaround: 'Turnaround Time',
                    waitTime: 'Wait Time',
                  };
                  return [`${value} ticks`, labelMap[name] || name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    turnaround: 'Turnaround Time',
                    waitTime: 'Wait Time',
                  };
                  return map[value] || value;
                }}
              />
              <Bar dataKey="turnaround" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="waitTime" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
