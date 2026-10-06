import type { ReactNode } from 'react';
import { useSimStore } from '../store/useSimStore';
import { AlertTriangle } from 'lucide-react';
import RingGauge from './ui/RingGauge';
import { CHART } from '../lib/colors';

type Level = 'normal' | 'high' | 'critical';

const VALUE_TONE: Record<Level, string> = {
  normal: 'text-ink',
  high: 'text-warning',
  critical: 'text-danger',
};

// Ring colours: the resource's own series colour when normal, status tokens past a threshold
const RING_COLOR: Record<Exclude<Level, 'normal'>, string> = {
  high: 'rgb(var(--warning))',
  critical: 'rgb(var(--danger))',
};

const TRACK_COLOR: Record<Level, string> = {
  normal: 'rgb(var(--surface-muted))',
  high: 'rgb(var(--warning-soft))',
  critical: 'rgb(var(--danger-soft))',
};

export default function GaugeRow() {
  const { result, currentTick } = useSimStore();

  if (!result?.snapshots || result.snapshots.length === 0) return null;

  const currentSnapshot = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!currentSnapshot) return null;

  const totalFrames = currentSnapshot.frames.length;
  const occupiedFrames = currentSnapshot.frames.filter(f => f !== null).length;
  const ramPercent = totalFrames > 0 ? Math.round((occupiedFrames / totalFrames) * 100) : 0;

  // Recent ticks calculation (window of last 20 ticks for dynamic util)
  const windowStart = Math.max(0, currentTick - 19);
  const recentSnapshots = result.snapshots.slice(windowStart, currentTick + 1);
  const cpuRecentBusy = recentSnapshots.filter(s => s.cpu_busy).length;
  const cpuPercent = Math.round((cpuRecentBusy / recentSnapshots.length) * 100);

  const diskRecentBusy = recentSnapshots.filter(s => s.disk_busy).length;
  const diskPercent = Math.round((diskRecentBusy / recentSnapshots.length) * 100);

  // Same thresholds as before: CPU > 85 high, RAM > 75 high / > 90 critical, Disk > 80 high
  const cpuLevel: Level = cpuPercent > 85 ? 'high' : 'normal';
  let ramLevel: Level = 'normal';
  if (ramPercent > 90) ramLevel = 'critical';
  else if (ramPercent > 75) ramLevel = 'high';
  const diskLevel: Level = diskPercent > 80 ? 'high' : 'normal';

  return (
    <section aria-labelledby="gauge-row-title" className="bg-surface border border-line rounded-xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 id="gauge-row-title" className="text-base font-semibold text-ink">การใช้ทรัพยากรขณะนี้</h3>
        <p className="text-sm text-muted">CPU และ Disk คิดจาก 20 tick ล่าสุด ส่วน RAM คิดจากเฟรมที่ใช้อยู่ ณ tick นี้</p>
      </div>

      {currentSnapshot.thrashing && (
        <div className="mb-4 flex items-start gap-2.5 border-l-[3px] border-danger bg-danger-soft rounded-r-lg px-3.5 py-2.5 text-sm">
          <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
          <p className="text-ink leading-relaxed">
            <span className="font-semibold text-danger">กำลัง thrashing</span>{' '}
            ระบบสูญเสียรอบประมวลผลไปกับการสลับหน้าข้อมูลลงดิสก์อย่างต่อเนื่อง (paging overhead)
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <Meter
          label="CPU"
          value={cpuPercent}
          level={cpuLevel}
          color={CHART.cpu}
          active={currentSnapshot.cpu_busy}
          detail={
            currentSnapshot.running !== null ? (
              <span>
                กำลังรัน <span className="font-mono">P{currentSnapshot.running}</span>
              </span>
            ) : (
              <span>ไม่มี process รัน</span>
            )
          }
        />
        <Meter
          label="RAM"
          value={ramPercent}
          level={ramLevel}
          color={CHART.ram}
          detail={
            <>
              <span>
                <span className="font-mono">{occupiedFrames}/{totalFrames}</span> เฟรม
              </span>
              {result.metrics && (
                <span>
                  page fault รวม <span className="font-mono">{result.metrics.total_page_faults}</span>
                </span>
              )}
            </>
          }
        />
        <Meter
          label="Disk I/O"
          value={diskPercent}
          level={diskLevel}
          color={CHART.disk}
          active={currentSnapshot.disk_busy}
          detail={
            <span>
              คิว <span className="font-mono">{currentSnapshot.disk_queue?.length || 0}</span>
            </span>
          }
        />
      </div>
    </section>
  );
}

interface MeterProps {
  label: string;
  value: number;
  level: Level;
  // the resource's series colour (used while below the warning threshold)
  color: string;
  // busy/idle state of the device right now (omitted for RAM)
  active?: boolean;
  detail: ReactNode;
}

function Meter({ label, value, level, color, active, detail }: Readonly<MeterProps>) {
  return (
    <div className="min-w-0 flex flex-col items-center text-center gap-2 md:flex-row md:items-center md:text-left md:gap-4">
      <RingGauge
        value={value}
        color={level === 'normal' ? color : RING_COLOR[level]}
        trackColor={TRACK_COLOR[level]}
        size={72}
        stroke={8}
        label={label}
        valueClassName={VALUE_TONE[level]}
      />

      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <div className="flex flex-col gap-0.5 text-xs text-muted tabular-nums">{detail}</div>
        {active !== undefined && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-subtle'}`}
            />
            {active ? 'ทำงาน' : 'ว่าง'}
          </p>
        )}
      </div>
    </div>
  );
}
