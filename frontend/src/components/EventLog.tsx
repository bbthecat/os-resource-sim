import { useSimStore, isPidShown } from '../store/useSimStore';
import { Activity } from 'lucide-react';

export default function EventLog() {
  const { result, currentTick, hiddenPids } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  // Collect events around current tick (e.g. last 15 ticks)
  const windowStart = Math.max(0, currentTick - 15);
  const recentEvents: { tick: number; event: string }[] = [];
  let filteredOut = 0;

  for (let t = currentTick; t >= windowStart; t--) {
    const snap = result.snapshots[t];
    if (snap && snap.events) {
      for (const ev of snap.events) {
        // `action:pid[:...]`; events without a pid (e.g. thrashing_start) always stay
        const target = Number.parseInt(ev.split(':')[1]);
        if (!Number.isNaN(target) && !isPidShown(hiddenPids, target)) {
          filteredOut++;
          continue;
        }
        recentEvents.push({ tick: t, event: ev });
      }
    }
  }

  const formatEventBadge = (eventStr: string) => {
    const [action, target] = eventStr.split(':');
    let toneClass = 'text-ink';
    let thaiAction = action;
    // unrecognised events show the raw action string, so they stay monospaced
    let isRaw = true;

    if (action.includes('page_fault')) {
      toneClass = 'text-danger';
      thaiAction = 'เกิด Page Fault (หาในแรมไม่เจอ)';
      isRaw = false;
    } else if (action.includes('evict')) {
      toneClass = 'text-warning';
      thaiAction = 'เตะหน้าออกจากแรม (Evict)';
      isRaw = false;
    } else if (action.includes('io_done')) {
      toneClass = 'text-info';
      thaiAction = 'อ่านเขียนดิสก์เสร็จ (I/O Done)';
      isRaw = false;
    } else if (action.includes('arrive')) {
      thaiAction = 'โปรเซสเข้าสู่ระบบ (Arrive)';
      isRaw = false;
    } else if (action.includes('preempt')) {
      thaiAction = 'หมดโควตาเวลา โดนสลับออก (Preempt)';
      isRaw = false;
    } else if (action.includes('finish') || action.includes('done')) {
      toneClass = 'text-primary';
      thaiAction = 'ทำงานเสร็จสิ้น (Finish)';
      isRaw = false;
    }

    return (
      <span className="flex items-baseline gap-2 min-w-0 font-mono text-xs">
        <span className={`${isRaw ? '' : 'font-sans text-sm'} font-medium ${toneClass}`}>{thaiAction}</span>
        {target && <span className="text-muted">P{target}</span>}
      </span>
    );
  };

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Activity size={16} className="text-muted" />
            บันทึกเหตุการณ์เคอร์เนล
          </h3>
          <p className="mt-0.5 text-sm text-muted">เหตุการณ์ย้อนหลัง 15 tick นับจากตำแหน่งปัจจุบัน</p>
        </div>
        <span className="shrink-0 text-xs text-muted">
          Tick <span className="font-mono tabular-nums text-ink">{currentTick}</span>
        </span>
      </div>

      <div className="max-h-[220px] overflow-y-auto rounded-lg border border-line">
        {recentEvents.length > 0 ? (
          <ul className="divide-y divide-line">
            {recentEvents.map((item, idx) => {
              const isCurrent = item.tick === currentTick;
              return (
                <li
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-1.5 ${isCurrent ? 'bg-primary-soft/50' : ''}`}
                >
                  <span className="w-12 shrink-0 font-mono text-xs text-subtle tabular-nums">T+{item.tick}</span>
                  {formatEventBadge(item.event)}
                  {isCurrent && (
                    <span className="ml-auto shrink-0 text-xs font-medium text-primary">ปัจจุบัน</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-subtle text-center py-6 text-sm">
            {filteredOut > 0
              ? 'ไม่มีเหตุการณ์ของโปรเซสที่เลือกในช่วงนี้'
              : 'ไม่มีเหตุการณ์เคอร์เนลในช่วงนี้'}
          </div>
        )}
      </div>
    </section>
  );
}
