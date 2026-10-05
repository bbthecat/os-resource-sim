import { useMemo, useRef } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { GanttChartSquare } from 'lucide-react';
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

  if (!result || segments.length === 0) return null;

  const totalTicks = result.snapshots.length;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTick = Math.round(clickRatio * (totalTicks - 1));
    setTick(targetTick);
  };

  const playheadPercent = totalTicks > 1 ? (currentTick / (totalTicks - 1)) * 100 : 0;

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
        <div className="flex items-center space-x-3 text-xs font-mono text-blue-700 font-bold bg-pastel-blue/50 px-3 py-1 rounded-full border border-pastel-blue">
          <span>{totalTicks} ticks total</span>
        </div>
      </div>

      {/* Gantt Bar Track */}
      <Tooltip.Provider delayDuration={100}>
        <div className="relative z-10 space-y-2 pt-2 pb-1">
          <div
            ref={containerRef}
            onClick={handleTrackClick}
            className="relative h-12 w-full bg-slate-100 rounded-xl overflow-hidden flex border border-border-subtle cursor-pointer select-none shadow-inner group/track hover:border-pastel-blue transition-colors"
          >
            {segments.map((seg, idx) => {
              const widthPct = (seg.duration / totalTicks) * 100;
              const isIdle = seg.pid === null;
              
              return (
                <Tooltip.Root key={idx}>
                  <Tooltip.Trigger asChild>
                    <motion.div
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.02, ease: "easeOut" }}
                      className="h-full flex items-center justify-center text-[11px] font-bold font-mono border-r border-white/40 transition-all duration-200 hover:brightness-110 hover:z-10 relative overflow-hidden"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: isIdle ? '#f1f5f9' : pidColor(seg.pid),
                        color: isIdle ? '#94a3b8' : '#ffffff',
                        boxShadow: isIdle ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : 'inset 0 2px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.1)',
                      }}
                    >
                      {/* Glossy overlay effect for 3D bar look */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                      
                      {widthPct > 2.5 && (
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

            {/* Interactive Playhead Line */}
            <motion.div
              animate={{ left: `${playheadPercent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none z-20 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            >
              <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <div className="absolute -bottom-7 -left-5 bg-white text-blue-600 border border-pastel-blue text-[10px] font-bold font-mono px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap">
                T={currentTick}
              </div>
            </motion.div>
          </div>

          {/* Time Scale Marks */}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-3 px-1 font-semibold">
            <span>T+0</span>
            <span>T+{Math.round(totalTicks * 0.25)}</span>
            <span>T+{Math.round(totalTicks * 0.5)}</span>
            <span>T+{Math.round(totalTicks * 0.75)}</span>
            <span>T+{totalTicks - 1}</span>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
