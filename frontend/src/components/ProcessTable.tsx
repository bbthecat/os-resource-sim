import { useMemo } from 'react';
import { useSimStore, isPidShown } from '../store/useSimStore';
import { pidColor, statusStyle } from '../lib/colors';
import { ListOrdered } from 'lucide-react';

const STATUS_THAI: Record<string, string> = {
  RUNNING: 'กำลังรัน',
  READY: 'รอในคิว',
  WAITING_IO: 'รอดิสก์',
  WAITING_MEM: 'รอแรม (PF)',
  DONE: 'เสร็จสิ้น',
  NEW: 'ยังไม่เข้าระบบ',
};

export default function ProcessTable() {
  const { result, currentTick, hiddenPids } = useSimStore();

  // Per-tick running totals so each playback frame is an O(1) lookup
  const cumulative = useMemo(() => {
    const snaps = result?.snapshots ?? [];
    const procs: any[] = result?.metrics?.per_process ?? [];
    const wait = new Map<number, Int32Array>();
    const faults = new Map<number, Int32Array>();
    for (const p of procs) {
      wait.set(p.pid, new Int32Array(snaps.length));
      faults.set(p.pid, new Int32Array(snaps.length));
    }
    const waitRun = new Map<number, number>();
    const faultRun = new Map<number, number>();
    snaps.forEach((snap, i) => {
      // matches the engine: wait_time grows for every tick spent in READY. The snapshot is taken
      // after the run phase, so a process preempted at the end of its quantum is in `ready` too —
      // it ran this tick, so it did not wait.
      for (const pid of snap.ready) {
        if (pid !== snap.running) waitRun.set(pid, (waitRun.get(pid) ?? 0) + 1);
      }
      for (const ev of snap.events) {
        if (ev.startsWith('page_fault:')) {
          const pid = Number.parseInt(ev.split(':')[1]);
          faultRun.set(pid, (faultRun.get(pid) ?? 0) + 1);
        }
      }
      for (const p of procs) {
        wait.get(p.pid)![i] = waitRun.get(p.pid) ?? 0;
        faults.get(p.pid)![i] = faultRun.get(p.pid) ?? 0;
      }
    });
    return { wait, faults };
  }, [result]);

  if (!result?.metrics?.per_process) return null;

  const processes: any[] = result.metrics.per_process;
  const shownProcesses = processes.filter((p) => isPidShown(hiddenPids, p.pid));
  const hiddenCount = processes.length - shownProcesses.length;
  const t = Math.min(currentTick, result.snapshots.length - 1);
  const snap = result.snapshots[t];

  const isLastTick = t === result.snapshots.length - 1;
  const stateAt = (proc: any): string => {
    // the engine stamps finish_time = t + 1 for work completed during tick t;
    // on the final tick show the end-of-run state so every finished process reads DONE
    const finish = proc.finish_time;
    if (finish !== null && finish !== undefined && (finish <= t || (isLastTick && finish <= t + 1))) return 'DONE';
    if (!snap) return proc.state;
    if (snap.running === proc.pid) return 'RUNNING';
    if (snap.ready.includes(proc.pid)) return 'READY';
    if (snap.waiting_mem.includes(proc.pid)) return 'WAITING_MEM';
    if (snap.waiting_io.includes(proc.pid) || snap.disk_queue.includes(proc.pid)) return 'WAITING_IO';
    return 'NEW';
  };

  const ticks = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `${v}t`);

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <ListOrdered size={16} className="text-muted" />
          ตารางสถิติรายโปรเซส
        </h3>
        <p className="mt-0.5 text-sm text-muted">
          ค่า ณ tick <span className="font-mono tabular-nums text-ink">{t}</span> ส่วน turnaround แสดงเมื่อโปรเซสนั้นทำงานเสร็จแล้ว
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-surface-muted text-muted text-xs font-medium border-b border-line">
            <tr>
              <th className="py-2 px-3 font-medium">PID</th>
              <th className="py-2 px-3 font-medium">Priority</th>
              <th className="py-2 px-3 font-medium">Arrival</th>
              <th className="py-2 px-3 font-medium">State</th>
              <th className="py-2 px-3 font-medium">Turnaround</th>
              <th className="py-2 px-3 font-medium">Wait</th>
              <th className="py-2 px-3 font-medium">Response</th>
              <th className="py-2 px-3 font-medium" title="Page faults">PF</th>
            </tr>
          </thead>
          <tbody>
            {shownProcesses.map((proc: any) => {
              const state = stateAt(proc);
              const s = statusStyle(state);
              const finished = state === 'DONE';
              const started = proc.first_run !== null && proc.first_run !== undefined && proc.first_run <= t;
              return (
                <tr
                  key={proc.pid}
                  className="border-b border-line last:border-b-0 hover:bg-surface-muted/60 transition-colors"
                >
                  <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: pidColor(proc.pid) }}
                    />
                    P{proc.pid}
                  </td>
                  <td className="py-2 px-3 text-muted font-mono tabular-nums">{proc.priority ?? '-'}</td>
                  <td className="py-2 px-3 text-muted font-mono tabular-nums">T+{proc.arrival}</td>
                  <td className="py-2 px-3">
                    <span
                      title={STATUS_THAI[state] ?? state}
                      className="inline-block rounded-full text-xs font-medium px-2 py-0.5 whitespace-nowrap cursor-help"
                      style={{ backgroundColor: s.bg, color: s.fg }}
                    >
                      {state}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums">{finished ? ticks(proc.turnaround) : '–'}</td>
                  <td className="py-2 px-3 font-mono tabular-nums">{ticks(cumulative.wait.get(proc.pid)?.[t] ?? 0)}</td>
                  <td className="py-2 px-3 font-mono tabular-nums">{started ? ticks(proc.response) : '–'}</td>
                  <td className="py-2 px-3 font-mono tabular-nums font-medium text-warning">
                    {cumulative.faults.get(proc.pid)?.[t] ?? 0}
                  </td>
                </tr>
              );
            })}
            {shownProcesses.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 px-3 text-center text-sm text-subtle">
                  ไม่มีโปรเซสที่แสดงตามตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <p className="text-xs text-muted">
          ซ่อน <span className="tabular-nums">{hiddenCount}</span> โปรเซสจากตัวกรอง
        </p>
      )}
    </section>
  );
}
