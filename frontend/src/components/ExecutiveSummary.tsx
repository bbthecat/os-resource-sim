import { useState, useMemo } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Check, AlertTriangle, AlertOctagon, ChevronDown, FastForward, Radio, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sparkline from './ui/Sparkline';
import { CHART } from '../lib/colors';
import type { Snapshot } from '../types/sim';

// Rolling window (ticks) for the CPU / Disk / thrashing trend lines
const TREND_WINDOW = 10;
// Sparklines never draw more than this many points, so 50 ticks/s playback stays cheap
const MAX_POINTS = 120;

type Tone = 'normal' | 'warning' | 'danger';

const VALUE_TONE: Record<Tone, string> = {
  normal: 'text-ink',
  warning: 'text-warning',
  danger: 'text-danger',
};

type Verdict = 'healthy' | 'bottleneck' | 'critical';

const VERDICT_STYLE: Record<Verdict, { band: string; disc: string; eyebrow: string; rule: string; label: string }> = {
  healthy: {
    band: 'bg-primary-soft border-primary/25',
    disc: 'bg-primary',
    eyebrow: 'text-primary-ink',
    rule: 'border-primary/25',
    label: 'ไม่พบคอขวด',
  },
  bottleneck: {
    band: 'bg-warning-soft border-warning-line',
    disc: 'bg-warning',
    eyebrow: 'text-warning',
    rule: 'border-warning-line',
    label: 'พบคอขวด',
  },
  critical: {
    band: 'bg-danger-soft border-danger-line',
    disc: 'bg-danger',
    eyebrow: 'text-danger',
    rule: 'border-danger-line',
    label: 'พบคอขวดรุนแรง',
  },
};

// Per-tick trend values for the whole run (computed once per result)
interface TrendSeries {
  cpu: number[];
  disk: number[];
  fault: number[];
  thrash: number[];
  ready: number[];
  finished: number[];
  readyMax: number;
  finishedMax: number;
}

// Processes finishing at each tick: per-process finish_time when available (same source as the
// live tile value), otherwise unique `finish:` events
function finishesPerTick(snaps: Snapshot[], perProcess: any[] | undefined): number[] {
  const n = snaps.length;
  const finishAt = new Array<number>(n).fill(0);
  if (Array.isArray(perProcess)) {
    perProcess.forEach((p: any) => {
      if (p?.finish_time === null || p?.finish_time === undefined) return;
      const idx = Math.max(0, Math.ceil(p.finish_time));
      if (idx < n) finishAt[idx]++;
    });
    return finishAt;
  }
  const seen = new Set<string>();
  snaps.forEach((s, i) => {
    s.events?.forEach(e => {
      if (e.startsWith('finish:') && !seen.has(e)) {
        seen.add(e);
        finishAt[i]++;
      }
    });
  });
  return finishAt;
}

function buildTrends(snaps: Snapshot[], perProcess: any[] | undefined): TrendSeries {
  const n = snaps.length;
  const cpuCum = new Array<number>(n);
  const diskCum = new Array<number>(n);
  const thrashCum = new Array<number>(n);
  const cpu = new Array<number>(n);
  const disk = new Array<number>(n);
  const thrash = new Array<number>(n);
  const fault = new Array<number>(n);
  const ready = new Array<number>(n);
  const finished = new Array<number>(n);
  const finishAt = finishesPerTick(snaps, perProcess);
  const rolling = (cum: number[], i: number) =>
    ((cum[i] - (i >= TREND_WINDOW ? cum[i - TREND_WINDOW] : 0)) / Math.min(TREND_WINDOW, i + 1)) * 100;

  let c = 0;
  let d = 0;
  let th = 0;
  let faults = 0;
  let accesses = 0;
  let done = 0;
  let readyMax = 0;

  for (let i = 0; i < n; i++) {
    const s = snaps[i];
    c += s.cpu_busy ? 1 : 0;
    d += s.disk_busy ? 1 : 0;
    th += s.thrashing ? 1 : 0;
    cpuCum[i] = c;
    diskCum[i] = d;
    thrashCum[i] = th;

    s.events?.forEach(e => {
      if (e.startsWith('page_fault')) faults++;
      else if (e.startsWith('mem_access:')) accesses++;
    });
    done += finishAt[i];

    cpu[i] = rolling(cpuCum, i);
    disk[i] = rolling(diskCum, i);
    thrash[i] = rolling(thrashCum, i);
    // same formula as the live metric: cumulative faults / cumulative memory accesses
    fault[i] = accesses > 0 ? (faults / accesses) * 100 : 0;
    ready[i] = s.ready ? s.ready.length : 0;
    finished[i] = done;
    if (ready[i] > readyMax) readyMax = ready[i];
  }

  return { cpu, disk, fault, thrash, ready, finished, readyMax, finishedMax: done };
}

// Shrink the first `count` values to at most MAX_POINTS by bucket (mean for rates, last value for running totals)
function downsample(values: number[], count: number, mode: 'mean' | 'last'): number[] {
  if (count <= MAX_POINTS) return values.slice(0, count);
  const out = new Array<number>(MAX_POINTS);
  for (let k = 0; k < MAX_POINTS; k++) {
    const start = Math.floor((k * count) / MAX_POINTS);
    const end = Math.floor(((k + 1) * count) / MAX_POINTS);
    if (mode === 'last') {
      out[k] = values[end - 1];
    } else {
      let sum = 0;
      for (let i = start; i < end; i++) sum += values[i];
      out[k] = sum / (end - start);
    }
  }
  return out;
}

// The verdict for the overview tab: a status-tinted band, then live stat tiles with trend lines
export default function ExecutiveSummary() {
  const { result, currentTick, setTick } = useSimStore();
  const [showLogic, setShowLogic] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'overall'>('live');

  // Real-time live cumulative metrics up to currentTick
  // (computed before the early return so the hook order stays stable between renders)
  const liveMetrics = useMemo(() => {
    if (!result?.snapshots || result.snapshots.length === 0) return null;
    const count = Math.min(currentTick + 1, result.snapshots.length);
    const snaps = result.snapshots.slice(0, count);
    const n = snaps.length || 1;

    const cpuBusy = snaps.filter(s => s.cpu_busy).length;
    const diskBusy = snaps.filter(s => s.disk_busy).length;
    const thrashingCount = snaps.filter(s => s.thrashing).length;

    // same definition as the backend metric: faults / memory accesses
    let pageFaultCount = 0;
    let memAccessCount = 0;
    snaps.forEach(s => {
      s.events?.forEach(e => {
        if (e.startsWith('page_fault')) pageFaultCount++;
        else if (e.startsWith('mem_access:')) memAccessCount++;
      });
    });

    const lastSnap = snaps[snaps.length - 1];
    const readyQueueLen = lastSnap?.ready ? lastSnap.ready.length : 0;

    let finishedProcs = 0;
    if (result.metrics && (result.metrics as any).per_process) {
      finishedProcs = (result.metrics as any).per_process.filter(
        (p: any) => p.finish_time !== null && p.finish_time <= currentTick
      ).length;
    } else {
      const finishedSet = new Set<string>();
      snaps.forEach(s => {
        s.events?.forEach(e => {
          if (e.startsWith('finish:')) finishedSet.add(e);
        });
      });
      finishedProcs = finishedSet.size;
    }

    return {
      cpuUtil: (cpuBusy / n) * 100,
      diskUtil: (diskBusy / n) * 100,
      pageFaultRate: memAccessCount > 0 ? (pageFaultCount / memAccessCount) * 100 : 0,
      thrashingFraction: (thrashingCount / n) * 100,
      readyQueue: readyQueueLen,
      finishedProcs,
    };
  }, [result, currentTick]);

  // Full-run trend series, built once per result
  const trends = useMemo(() => {
    if (!result?.snapshots || result.snapshots.length === 0) return null;
    return buildTrends(result.snapshots, (result.metrics as any)?.per_process);
  }, [result]);

  // Trend lines from t=0 up to the current tick (the whole run in overall mode or at the end)
  const total = result?.snapshots?.length ?? 0;
  const showFullRun = viewMode === 'overall' || currentTick >= total - 1;
  const sparkCount = showFullRun ? total : Math.min(currentTick + 1, total);
  const sparks = useMemo(() => {
    if (!trends || sparkCount === 0) return null;
    return {
      cpu: downsample(trends.cpu, sparkCount, 'mean'),
      disk: downsample(trends.disk, sparkCount, 'mean'),
      fault: downsample(trends.fault, sparkCount, 'last'),
      thrash: downsample(trends.thrash, sparkCount, 'mean'),
      ready: downsample(trends.ready, sparkCount, 'mean'),
      finished: downsample(trends.finished, sparkCount, 'last'),
    };
  }, [trends, sparkCount]);

  if (!result?.diagnosis) return null;

  const { diagnosis, metrics } = result;
  const isHealthy = diagnosis.label === 'BALANCED' || diagnosis.label === 'UNDERUTILIZED';
  const isCritical = diagnosis.label === 'THRASHING';
  const maxTick = result.snapshots ? Math.max(0, result.snapshots.length - 1) : 0;
  const isAtEnd = currentTick >= maxTick;

  // Display metrics depending on viewMode (Live vs Overall)
  const isLive = viewMode === 'live' && !isAtEnd;
  const values = isLive && liveMetrics ? {
    cpu: liveMetrics.cpuUtil,
    disk: liveMetrics.diskUtil,
    fault: liveMetrics.pageFaultRate,
    thrash: liveMetrics.thrashingFraction,
    ready: liveMetrics.readyQueue,
    readyDigits: 0,
    finished: liveMetrics.finishedProcs,
  } : {
    cpu: metrics.cpu_util * 100,
    disk: metrics.disk_util * 100,
    fault: metrics.page_fault_rate * 100,
    thrash: metrics.thrashing_fraction * 100,
    ready: metrics.avg_ready_queue,
    readyDigits: 1,
    finished: metrics.finished_processes,
  };

  // Rule explanations based on analyzer.py logic
  const getRuleExplanation = () => {
    switch (diagnosis.label) {
      case 'THRASHING':
        return `ระบบประเมินจากสถิติพบว่า: สัดส่วนเวลา Thrashing (${(metrics.thrashing_fraction * 100).toFixed(0)}% ≥ 25%) ร่วมกับ Disk เสียเวลาโหลดสลับหน้า Page (${(metrics.swap_share * 100).toFixed(0)}% ≥ 60%) ทำให้ CPU ต้องรอ I/O ตลอดเวลา`;
      case 'MEMORY_PRESSURE':
        return `ระบบประเมินจากสถิติพบว่า: Page Fault Rate (${(metrics.page_fault_rate * 100).toFixed(0)}% ≥ 10%) และ Swap Share สูง แต่ CPU ยังไม่เต็ม เกิดจาก RAM ไม่พอรองรับ Working Set`;
      case 'IO_BOUND':
        return `ระบบประเมินจากสถิติพบว่า: Disk Utilization (${(metrics.disk_util * 100).toFixed(0)}% ≥ 80%) ทำงานหนักจาก I/O ปกติของ Process เอง ไม่ใช่จากการ Paging`;
      case 'CPU_BOUND':
        return `ระบบประเมินจากสถิติพบว่า: CPU Utilization (${(metrics.cpu_util * 100).toFixed(0)}% ≥ 85%) สูงมาก และมี Process รอใน Ready Queue เฉลี่ย (${metrics.avg_ready_queue.toFixed(1)} ตัว ≥ 1.5)`;
      case 'UNDERUTILIZED':
        return `ระบบประเมินจากสถิติพบว่า: ทั้ง CPU (${(metrics.cpu_util * 100).toFixed(0)}%) และ Disk (${(metrics.disk_util * 100).toFixed(0)}%) ใช้งานต่ำกว่า 50% ไม่มีจุดติดขัด`;
      case 'BALANCED':
      default:
        return `ระบบประเมินจากสถิติพบว่า: ทรัพยากรทั้งหมด (CPU, RAM, Disk) อยู่ในระดับสมดุล ไม่เกินค่า Threshold วิกฤต`;
    }
  };

  // Value colour follows the analyzer thresholds quoted in the rule explanations above
  const tone = (warnAt: number, v: number): Tone => (v >= warnAt ? 'warning' : 'normal');
  const thrashTone: Tone = values.thrash >= 25 ? 'danger' : 'normal';

  const stats: { label: string; value: string; unit: string; tone: Tone; series?: number[]; color: string; min: number; max: number }[] = [
    { label: 'CPU ใช้งาน', value: values.cpu.toFixed(1), unit: '%', tone: tone(85, values.cpu), series: sparks?.cpu, color: CHART.cpu, min: 0, max: 100 },
    { label: 'Disk ใช้งาน', value: values.disk.toFixed(1), unit: '%', tone: tone(80, values.disk), series: sparks?.disk, color: CHART.disk, min: 0, max: 100 },
    { label: 'อัตรา page fault', value: values.fault.toFixed(1), unit: '%', tone: tone(10, values.fault), series: sparks?.fault, color: CHART.ram, min: 0, max: 100 },
    { label: 'Thrashing', value: values.thrash.toFixed(1), unit: '%', tone: thrashTone, series: sparks?.thrash, color: CHART.fault, min: 0, max: 100 },
    { label: 'คิว Ready', value: values.ready.toFixed(values.readyDigits), unit: 'ตัว', tone: 'normal', series: sparks?.ready, color: CHART.ready, min: 0, max: Math.max(1, trends?.readyMax ?? 1) },
    { label: 'ทำงานเสร็จ', value: String(values.finished), unit: 'ตัว', tone: 'normal', series: sparks?.finished, color: CHART.cpu, min: 0, max: Math.max(1, trends?.finishedMax ?? 1) },
  ];

  const modes = [
    { id: 'live' as const, label: 'Real-time', Icon: Radio },
    { id: 'overall' as const, label: 'ภาพรวมทั้งหมด', Icon: BarChart3 },
  ];

  let verdict: Verdict = 'bottleneck';
  if (isHealthy) verdict = 'healthy';
  else if (isCritical) verdict = 'critical';
  const vs = VERDICT_STYLE[verdict];
  let StatusIcon = AlertTriangle;
  if (verdict === 'healthy') StatusIcon = Check;
  else if (verdict === 'critical') StatusIcon = AlertOctagon;

  return (
    <section aria-labelledby="executive-summary-title" className="space-y-3">
      {/* Verdict band */}
      <div className={`rounded-2xl border px-4 py-4 sm:px-5 ${vs.band}`}>
        <div className="flex items-start gap-3.5 sm:gap-4">
          <span
            aria-hidden="true"
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white ${vs.disc}`}
          >
            <StatusIcon size={22} strokeWidth={2.25} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className={`font-semibold ${vs.eyebrow}`}>{vs.label}</span>
              <span className="text-ink/60">ผลวินิจฉัยจากการรันทั้งหมด</span>
            </p>
            <h2
              id="executive-summary-title"
              className="mt-0.5 text-xl sm:text-2xl font-semibold leading-snug text-ink"
            >
              {diagnosis.title}
            </h2>
            <p className="mt-1 text-sm sm:text-[15px] text-ink/75 leading-relaxed max-w-3xl">
              {diagnosis.recommendation}
            </p>

            <button
              onClick={() => setShowLogic(!showLogic)}
              aria-expanded={showLogic}
              aria-controls="executive-summary-logic"
              className="mt-2.5 -ml-1 inline-flex items-center gap-1 px-1 rounded-md text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              ทำไมระบบถึงสรุปแบบนี้
              <ChevronDown size={15} className={`transition-transform ${showLogic ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {showLogic && (
                <motion.div
                  id="executive-summary-logic"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`mt-3 pt-3 border-t space-y-1.5 max-w-3xl ${vs.rule}`}
                >
                  <p className="text-sm text-ink leading-relaxed">{getRuleExplanation()}</p>
                  <p className="text-xs text-ink/65 leading-relaxed">
                    เกณฑ์มาจากเงื่อนไขตามทฤษฎี OS ใน <span className="font-mono">sim/analyzer.py</span>{' '}
                    ทุกข้อสรุปคำนวณจากสถิติจริงของการจำลองรอบนี้ ไม่ได้ใช้ AI หรือสุ่มข้อความ
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tile controls: what the numbers below cover */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
        <p className="text-xs text-muted">
          {isLive ? (
            <>
              ตัวเลขสะสมถึง tick <span className="font-mono tabular-nums text-ink">{currentTick}</span> จาก{' '}
              <span className="font-mono tabular-nums">{maxTick}</span> และอัปเดตตามไทม์ไลน์
            </>
          ) : (
            <>
              ค่าตลอดการจำลอง <span className="font-mono tabular-nums">{maxTick}</span> tick
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="inline-flex bg-surface-muted p-1 rounded-lg">
            <legend className="sr-only">มุมมองตัวเลข</legend>
            {modes.map(({ id, label, Icon }) => {
              const selected = viewMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                    selected ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={14} className={selected ? 'text-primary' : undefined} />
                  {label}
                </button>
              );
            })}
          </fieldset>

          {!isAtEnd && (
            <button
              onClick={() => setTick(maxTick)}
              title="ข้ามไปดูจุดสิ้นสุดของการจำลอง"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors"
            >
              <FastForward size={14} className="text-muted" />
              ดูผลท้ายสุด
            </button>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {stats.map(({ label, value, unit, tone: t, series, color, min, max }) => (
          <div key={label} className="min-w-0 bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-3.5 pt-3">
              <dt className="text-xs text-muted truncate">{label}</dt>
              <dd className={`mt-0.5 text-xl sm:text-2xl font-semibold tabular-nums leading-tight ${VALUE_TONE[t]}`}>
                {value}
                {unit === '%' ? (
                  unit
                ) : (
                  <span className="ml-1 text-sm font-normal text-muted">{unit}</span>
                )}
              </dd>
            </div>
            <div className="mt-1.5 h-[30px]">
              {series && series.length > 1 && (
                <Sparkline values={series} color={color} height={30} min={min} max={max} className="block" />
              )}
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
