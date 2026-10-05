import { useSimStore } from '../store/useSimStore';
import { Activity } from 'lucide-react';

export default function EventLog() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  // Collect events around current tick (e.g. last 15 ticks)
  const windowStart = Math.max(0, currentTick - 15);
  const recentEvents: { tick: number; event: string }[] = [];

  for (let t = currentTick; t >= windowStart; t--) {
    const snap = result.snapshots[t];
    if (snap && snap.events) {
      for (const ev of snap.events) {
        recentEvents.push({ tick: t, event: ev });
      }
    }
  }

  const formatEventBadge = (eventStr: string) => {
    const [action, target] = eventStr.split(':');
    let colorClass = 'bg-gray-800 text-gray-300 border-gray-700';
    let thaiAction = action;

    if (action.includes('page_fault')) {
      colorClass = 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      thaiAction = 'เกิด Page Fault (หาในแรมไม่เจอ)';
    } else if (action.includes('evict')) {
      colorClass = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      thaiAction = 'เตะหน้าออกจากแรม (Evict)';
    } else if (action.includes('io_done')) {
      colorClass = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      thaiAction = 'อ่านเขียนดิสก์เสร็จ (I/O Done)';
    } else if (action.includes('arrive')) {
      colorClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
      thaiAction = 'โปรเซสเข้าสู่ระบบ (Arrive)';
    } else if (action.includes('preempt')) {
      colorClass = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      thaiAction = 'หมดโควตาเวลา โดนสลับออก (Preempt)';
    } else if (action.includes('finish') || action.includes('done')) {
      colorClass = 'bg-gray-700 text-gray-200 border-gray-600';
      thaiAction = 'ทำงานเสร็จสิ้น (Finish)';
    }

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${colorClass}`}>
        <strong className="font-sans font-semibold">{thaiAction}</strong> {target ? `→ P${target}` : ''}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-3.5 space-y-3 shadow-subtle">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="text-blue-400" size={16} />
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">บันทึกเหตุการณ์เคอร์เนล</h3>
            <p className="text-[10px] text-zinc-500 font-mono">KERNEL EVENT TELEMETRY (DMESG)</p>
          </div>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono">TICK {currentTick}</span>
      </div>

      <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 text-xs">
        {recentEvents.length > 0 ? (
          recentEvents.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-1.5 rounded transition ${
                item.tick === currentTick 
                  ? 'bg-blue-950/40 border border-blue-500/40' 
                  : 'bg-surface-raised/40 border border-border-subtle'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono text-zinc-500 text-[10px]">T+{item.tick}</span>
                {formatEventBadge(item.event)}
              </div>
              {item.tick === currentTick && (
                <span className="text-[9px] font-mono text-blue-400 font-medium tracking-wider">ACTIVE</span>
              )}
            </div>
          ))
        ) : (
          <div className="text-zinc-600 font-mono text-center py-6 text-xs">
            NO KERNEL EVENTS RECORDED
          </div>
        )}
      </div>
    </div>
  );
}
