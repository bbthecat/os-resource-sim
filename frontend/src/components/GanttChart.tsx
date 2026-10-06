import { useMemo, useRef, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { GanttChartSquare, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Segment {
  pid: number | null;
  start: number;
  end: number; // inclusive
  duration: number;
}

export default function GanttChart() {
  const { result, currentTick, setTick } = useSimStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const segments = useMemo<Segment[]>(() => {
    if (!result || !result.snapshots || result.snapshots.length === 0) return [];

    const segs: Segment[] = [];
    let currentSeg: Segment | null = null;

    for (const snap of result.snapshots) {
      if (!currentSeg) {
        currentSeg = { pid: snap.running, start: snap.t, end: snap.t, duration: 1 };
      } else if (currentSeg.pid === snap.running) {
        currentSeg.end = snap.t;
        currentSeg.duration += 1;
      } else {
        segs.push(currentSeg);
        currentSeg = { pid: snap.running, start: snap.t, end: snap.t, duration: 1 };
      }
    }
    if (currentSeg) {
      segs.push(currentSeg);
    }
    return segs;
  }, [result]);

  const pids = useMemo(() => {
    if (!result || segments.length === 0) return [];
    const pidsSet = new Set<number | null>();
    segments.forEach(s => pidsSet.add(s.pid));
    return Array.from(pidsSet).sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
  }, [result, segments]);

  if (!result || segments.length === 0) return null;

  const totalTicks = result.snapshots.length;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const actualWidth = rect.width;
    
    // We calculate click ratio based on clickX, which is relative to the start of containerRef
    const clickRatio = Math.max(0, Math.min(1, clickX / actualWidth));
    const targetTick = Math.round(clickRatio * (totalTicks - 1));
    setTick(targetTick);
  };

  const playheadPercent = totalTicks > 1 ? (currentTick / (totalTicks - 1)) * 100 : 0;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 10));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 1));

  return (
    <div className="glass-panel rounded-xl p-5 space-y-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/30 to-pastel-purple/30 opacity-50"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-white rounded-lg border border-pastel-blue shadow-glow">
            <GanttChartSquare className="text-blue-500" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide">
              CPU Execution Timeline
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5 uppercase">
              Dispatch Timeline & Context Switches
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-white/60 px-2 py-1 rounded-lg border border-border-subtle shadow-sm">
            <button onClick={handleZoomOut} disabled={zoom <= 1} className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors">
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono w-9 text-center font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} disabled={zoom >= 10} className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors">
              <ZoomIn size={14} />
            </button>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono text-blue-700 font-bold bg-pastel-blue/50 px-3 py-1.5 rounded-full border border-pastel-blue shadow-sm">
            <span>{totalTicks} ticks total</span>
          </div>
        </div>
      </div>

      {/* Gantt Bar Track */}
      <Tooltip.Provider delayDuration={100}>
        <div className="relative z-10 pt-2 pb-1">
          <div className="flex border border-border-subtle rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Y-axis labels (PIDs) - Fixed width */}
            <div className="w-16 shrink-0 flex flex-col justify-between border-r border-border-subtle bg-white z-20">
              {pids.map((pid) => (
                <div 
                  key={String(pid)} 
                  className={`h-12 flex items-center justify-center text-[11px] font-bold font-mono text-slate-600 border-b border-border-subtle/50 last:border-b-0`}
                >
                  {pid === null ? 'IDLE' : `P${pid}`}
                </div>
              ))}
              <div className="h-6 border-t border-border-subtle bg-slate-50"></div> {/* Spacer for time scale */}
            </div>

            {/* Scrollable Timeline container */}
            <div className="flex-1 overflow-x-auto bg-slate-50 relative custom-scrollbar">
              <div
                ref={containerRef}
                onClick={handleTrackClick}
                className="relative flex flex-col cursor-pointer select-none min-w-full"
                style={{ width: `${zoom * 100}%` }}
              >
                {/* Grid lines */}
                <div className="absolute top-0 bottom-6 left-0 right-0 flex justify-between pointer-events-none opacity-20">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div key={pct} className="h-full w-px bg-slate-400" style={{ left: `${pct}%`, position: 'absolute' }} />
                  ))}
                </div>

                {/* Tracks */}
                {pids.map((pid) => (
                  <div 
                    key={String(pid)} 
                    className={`relative h-12 border-b border-border-subtle/50 last:border-b-0 w-full overflow-hidden`}
                  >
                    {segments.filter(s => s.pid === pid).map((seg, idx) => {
                      const leftPct = (seg.start / totalTicks) * 100;
                      const widthPct = (seg.duration / totalTicks) * 100;
                      const isIdle = seg.pid === null;
                      
                      return (
                        <Tooltip.Root key={idx}>
                          <Tooltip.Trigger asChild>
                            <motion.div
                              initial={{ scaleX: 0, opacity: 0 }}
                              animate={{ scaleX: 1, opacity: 1 }}
                              transition={{ duration: 0.4, delay: idx * 0.01, ease: "easeOut" }}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: isIdle ? '#f1f5f9' : pidColor(seg.pid),
                                color: isIdle ? '#94a3b8' : '#ffffff',
                                boxShadow: isIdle ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : 'inset 0 2px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.1)',
                                transformOrigin: 'left center'
                              }}
                              className="absolute top-1.5 bottom-1.5 rounded-none flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-200 hover:brightness-110 hover:z-10 shadow-sm border-r border-white/20"
                            >
                              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-none"></div>
                              
                              {widthPct * zoom > 2.5 && (
                                <span className="truncate px-1.5 drop-shadow-sm relative z-10">
                                  {isIdle ? 'IDLE' : `P${seg.pid}`}
                                </span>
                              )}
                            </motion.div>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-white border border-border-subtle px-3 py-2 rounded-lg text-xs font-mono text-slate-700 shadow-xl flex flex-col gap-1 z-50 animate-fade-in"
                              sideOffset={5}
                            >
                              <div className="font-bold text-blue-500 mb-1 border-b border-border-subtle pb-1">
                                {isIdle ? 'IDLE STATE' : `Process P${seg.pid}`}
                              </div>
                              <div>Start: T+{seg.start}</div>
                              <div>End: T+{seg.end}</div>
                              <div className="text-slate-500">Duration: {seg.duration} ticks</div>
                              <Tooltip.Arrow className="fill-white" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      );
                    })}
                  </div>
                ))}

                {/* Interactive Playhead Line */}
                <motion.div
                  animate={{ left: `${playheadPercent}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute top-0 bottom-6 w-0.5 bg-blue-500 pointer-events-none z-30 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                >
                  <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <div className="absolute bottom-2 -left-5 bg-white text-blue-600 border border-pastel-blue text-[10px] font-bold font-mono px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap">
                    T={currentTick}
                  </div>
                </motion.div>

                {/* Time Scale Marks */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1 font-semibold border-t border-border-subtle bg-white/50 h-6">
                  <span>T+0</span>
                  <span>T+{Math.round(totalTicks * 0.25)}</span>
                  <span>T+{Math.round(totalTicks * 0.5)}</span>
                  <span>T+{Math.round(totalTicks * 0.75)}</span>
                  <span>T+{totalTicks - 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
