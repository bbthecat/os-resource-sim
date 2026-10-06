import { useMemo, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Layers, MousePointerClick } from 'lucide-react';
import { pidColor } from '../lib/colors';

interface TraceStep {
  tick: number;
  pageRequested: number;
  isHit: boolean;
  framesState: (number | null)[];
  frameOwners: (number | null)[];
}

export default function PageFaultTrace() {
  const { result } = useSimStore();
  const [selectedPid, setSelectedPid] = useState<number | 'all'>('all');

  // Extract all processes that made memory accesses
  const pidsWithMemory = useMemo(() => {
    if (!result) return [];
    const pids = new Set<number>();
    result.snapshots.forEach(snap => {
      snap.events.forEach(ev => {
        if (ev.startsWith('mem_access:')) {
          pids.add(parseInt(ev.split(':')[1]));
        }
      });
    });
    return Array.from(pids).sort((a, b) => a - b);
  }, [result]);

  const traces = useMemo(() => {
    if (!result || !result.snapshots) return [];
    
    const steps: TraceStep[] = [];
    
    // Map to keep track of pending misses for each PID
    // pid -> { tick, page }
    const pendingMisses = new Map<number, { tick: number, page: number }>();

    for (const snap of result.snapshots) {
      for (const ev of snap.events) {
        if (ev.startsWith('mem_access:')) {
          const parts = ev.split(':');
          const evPid = parseInt(parts[1]);
          const page = parseInt(parts[2]);
          const hit = parts[3] === '1';

          if (selectedPid === 'all' || evPid === selectedPid) {
            if (hit) {
              steps.push({
                tick: snap.t,
                pageRequested: page,
                isHit: true,
                framesState: [...(snap.frame_pages || [])],
                frameOwners: [...(snap.frames || [])]
              });
            } else {
              pendingMisses.set(evPid, { tick: snap.t, page });
            }
          }
        } else if (ev.startsWith('page_loaded:')) {
          const parts = ev.split(':');
          const evPid = parseInt(parts[1]);
          
          if (selectedPid === 'all' || evPid === selectedPid) {
            const pending = pendingMisses.get(evPid);
            if (pending) {
              steps.push({
                tick: pending.tick, // Show the tick it was requested
                pageRequested: pending.page,
                isHit: false,
                framesState: [...(snap.frame_pages || [])],
                frameOwners: [...(snap.frames || [])]
              });
              pendingMisses.delete(evPid);
            }
          }
        }
      }
    }
    
    return steps.sort((a, b) => a.tick - b.tick);
  }, [result, selectedPid]);

  if (!result) return null;

  const totalFaults = traces.filter(t => !t.isHit).length;
  const numFrames = result.config.ram_frames;

  return (
    <div className="glass-panel border border-border-subtle rounded-xl p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-pastel-yellow/30 rounded-lg shadow-sm border border-pastel-yellow">
            <Layers className="text-amber-600" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide">
              Page Replacement Trace
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5 uppercase">
              Memory Access History
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono bg-white px-2 py-1.5 rounded-lg border border-border-subtle shadow-sm">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Process:</span>
            <select 
              className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none font-bold text-blue-600 cursor-pointer"
              value={selectedPid}
              onChange={(e) => setSelectedPid(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">All Processes</option>
              {pidsWithMemory.map(pid => (
                <option key={pid} value={pid}>Process P{pid}</option>
              ))}
            </select>
          </div>
          
          <div className="text-xs font-mono text-amber-700 font-bold bg-pastel-yellow/50 px-3 py-1.5 rounded-full border border-pastel-yellow shadow-sm">
            Total Faults = {totalFaults}
          </div>
        </div>
      </div>

      {traces.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
          <MousePointerClick size={24} className="mb-2 opacity-50" />
          <p>No memory access trace available</p>
          <p className="text-[10px] mt-1">Try a workload that uses memory (e.g. Memory Hog)</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="inline-flex flex-col gap-2 min-w-full px-2">
            
            {/* Page Reference Row */}
            <div className="flex items-end mb-2">
              <div className="w-24 shrink-0 font-bold text-xs text-slate-600 font-mono">
                Page Ref
              </div>
              <div className="flex gap-1.5">
                {traces.map((trace, idx) => (
                  <div key={idx} className="w-8 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400">T{trace.tick}</span>
                    <span className="font-bold text-sm text-slate-800">
                      {trace.pageRequested}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Frame Rows */}
            <div className="flex">
              <div className="w-24 shrink-0 flex flex-col gap-1 pr-4">
                {Array.from({ length: numFrames }).map((_, frameIdx) => (
                  <div key={frameIdx} className="h-8 flex items-center justify-end font-bold text-[10px] text-slate-400 font-mono">
                    Frame {frameIdx}
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5">
                {traces.map((trace, traceIdx) => (
                  <div key={traceIdx} className="w-8 flex flex-col gap-1">
                    {Array.from({ length: numFrames }).map((_, frameIdx) => {
                      const page = trace.framesState[frameIdx];
                      const owner = trace.frameOwners[frameIdx];
                      const isOccupied = page !== null && owner !== null;
                      
                      // Highlight if this is the frame that was just loaded/accessed
                      const isNewlyLoaded = !trace.isHit && isOccupied && page === trace.pageRequested && (selectedPid === 'all' || owner === selectedPid);
                      
                      return (
                        <div 
                          key={frameIdx} 
                          className={`h-8 border flex items-center justify-center font-bold text-xs font-mono rounded-[2px] transition-colors
                            ${isOccupied ? 'shadow-sm' : 'bg-slate-50 border-slate-200 text-transparent'}
                            ${isNewlyLoaded ? 'border-amber-400 border-2' : ''}
                          `}
                          style={{
                            backgroundColor: isOccupied ? `${pidColor(owner)}20` : undefined,
                            borderColor: isOccupied && !isNewlyLoaded ? pidColor(owner) : undefined,
                            color: isOccupied ? pidColor(owner) : undefined
                          }}
                          title={isOccupied ? `P${owner} - Page ${page}` : 'Empty'}
                        >
                          {isOccupied ? page : '-'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hit/Miss Row */}
            <div className="flex mt-2">
              <div className="w-24 shrink-0"></div>
              <div className="flex gap-1.5">
                {traces.map((trace, idx) => (
                  <div 
                    key={idx} 
                    className={`w-8 text-center text-[10px] font-bold font-mono ${trace.isHit ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {trace.isHit ? 'Hit' : 'Miss'}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
