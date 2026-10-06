import type { ReactNode } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor, statusStyle } from '../lib/colors';
import { PlayCircle, Clock, Disc, AlertCircle, type LucideIcon } from 'lucide-react';

interface LaneProps {
  icon: LucideIcon;
  status: string;
  label: string;
  count?: number;
  children: ReactNode;
}

function Lane({ icon: Icon, status, label, count, children }: Readonly<LaneProps>) {
  return (
    <div className="bg-surface-muted rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
        <span className="flex items-center gap-1.5">
          <Icon size={14} style={{ color: statusStyle(status).dot }} />
          {label}
        </span>
        {count !== undefined && (
          <span className="min-w-[1.5rem] px-1.5 rounded-full bg-surface text-xs text-muted text-center tabular-nums">
            {count}
          </span>
        )}
      </div>
      <div className="min-h-[36px] flex flex-wrap gap-1 items-center">{children}</div>
    </div>
  );
}

function PidChip({ pid, label }: Readonly<{ pid: number; label?: string }>) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-white text-xs font-mono font-medium"
      style={{ backgroundColor: pidColor(pid) }}
    >
      {label ?? `P${pid}`}
    </span>
  );
}

function PidList({ pids }: Readonly<{ pids: number[] }>) {
  if (pids.length === 0) return <span className="text-xs text-subtle">ว่าง</span>;
  return (
    <>
      {pids.map((pid, idx) => (
        <PidChip key={`${pid}-${idx}`} pid={pid} />
      ))}
    </>
  );
}

export default function QueueLane() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  const current = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!current) return null;

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">สถานะโปรเซสและคิวงานในระบบ</h3>
        <p className="mt-0.5 text-sm text-muted">process ที่กำลังรันและที่รออยู่ในแต่ละคิว ณ tick ปัจจุบัน</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Lane icon={PlayCircle} status="RUNNING" label="Running on CPU">
          {current.running !== null ? (
            <PidChip pid={current.running} label={`PID ${current.running}`} />
          ) : (
            <span className="text-xs text-subtle">CPU ว่าง</span>
          )}
        </Lane>

        <Lane icon={Clock} status="READY" label="Ready queue" count={current.ready.length}>
          <PidList pids={current.ready} />
        </Lane>

        <Lane icon={Disc} status="WAITING_IO" label="Waiting I/O (disk)" count={current.waiting_io.length}>
          <PidList pids={current.waiting_io} />
        </Lane>

        <Lane icon={AlertCircle} status="WAITING_MEM" label="Page fault wait" count={current.waiting_mem.length}>
          <PidList pids={current.waiting_mem} />
        </Lane>
      </div>
    </section>
  );
}
