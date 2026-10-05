import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { PlayCircle, Clock, Disc, AlertCircle } from 'lucide-react';

export default function QueueLane() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  const current = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!current) return null;

  return (
    <div className="glass-panel border border-border-subtle rounded-xl p-4 space-y-3 shadow-card">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-800">สถานะโปรเซสและคิวงานในระบบ</h3>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">PROCESS LIFECYCLE & DISPATCH QUEUES</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Running */}
        <div className="bg-white border border-border-subtle rounded-md p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 mb-2">
            <PlayCircle size={14} className="text-emerald-500" />
            <span>Running on CPU</span>
          </div>
          <div className="min-h-[44px] flex items-center justify-center bg-slate-50 rounded-md border border-border-subtle p-1.5">
            {current.running !== null ? (
              <span 
                className="px-2.5 py-1 rounded font-mono font-bold text-white text-xs border border-white/40 shadow-sm flex items-center space-x-1"
                style={{ backgroundColor: pidColor(current.running) }}
              >
                <span>PID {current.running}</span>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] font-mono font-bold">CPU IDLE</span>
            )}
          </div>
        </div>

        {/* Ready Queue */}
        <div className="bg-white border border-border-subtle rounded-md p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-2">
            <div className="flex items-center space-x-1.5">
              <Clock size={14} className="text-blue-500" />
              <span>Ready Queue</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1 rounded">({current.ready.length})</span>
          </div>
          <div className="min-h-[44px] flex flex-wrap gap-1 items-center bg-slate-50 rounded-md border border-border-subtle p-1.5">
            {current.ready.length > 0 ? (
              current.ready.map((pid, idx) => (
                <span 
                  key={`${pid}-${idx}`}
                  className="px-2 py-0.5 rounded-md text-white text-[11px] font-mono font-bold border border-white/40 shadow-sm"
                  style={{ backgroundColor: pidColor(pid) }}
                >
                  P{pid}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-[11px] font-mono font-bold">EMPTY</span>
            )}
          </div>
        </div>

        {/* Waiting I/O */}
        <div className="bg-white border border-border-subtle rounded-md p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 mb-2">
            <div className="flex items-center space-x-1.5">
              <Disc size={14} className="text-amber-500" />
              <span>Waiting I/O (Disk)</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1 rounded">({current.waiting_io.length})</span>
          </div>
          <div className="min-h-[44px] flex flex-wrap gap-1 items-center bg-slate-50 rounded-md border border-border-subtle p-1.5">
            {current.waiting_io.length > 0 ? (
              current.waiting_io.map((pid, idx) => (
                <span 
                  key={`${pid}-${idx}`}
                  className="px-2 py-0.5 rounded-md text-white text-[11px] font-mono font-bold border border-white/40 shadow-sm"
                  style={{ backgroundColor: pidColor(pid) }}
                >
                  P{pid}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-[11px] font-mono font-bold">EMPTY</span>
            )}
          </div>
        </div>

        {/* Waiting Memory */}
        <div className="bg-white border border-border-subtle rounded-md p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-2">
            <div className="flex items-center space-x-1.5">
              <AlertCircle size={14} className="text-rose-500" />
              <span>Page Fault Wait</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1 rounded">({current.waiting_mem.length})</span>
          </div>
          <div className="min-h-[44px] flex flex-wrap gap-1 items-center bg-slate-50 rounded-md border border-border-subtle p-1.5">
            {current.waiting_mem.length > 0 ? (
              current.waiting_mem.map((pid, idx) => (
                <span 
                  key={`${pid}-${idx}`}
                  className="px-2 py-0.5 rounded-md text-white text-[11px] font-mono font-bold border border-white/40 shadow-sm"
                  style={{ backgroundColor: pidColor(pid) }}
                >
                  P{pid}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-[11px] font-mono font-bold">EMPTY</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
