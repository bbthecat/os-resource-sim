import { useMemo, useRef, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { GanttChartSquare, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
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
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTick = Math.round(clickRatio * (totalTicks - 1));
    setTick(targetTick);
  };

  const playheadPercent = totalTicks > 1 ? (currentTick / (totalTicks - 1)) * 100 : 0;

  const doZoomIn = () => setZoom(z => Math.min(z * 2, 16));
  const doZoomOut = () => setZoom(z => Math.max(z / 2, 1));
  const doZoomReset = () => setZoom(1);

  // Generate dynamic tick marks based on zoom level
  const tickMarks = useMemo(() => {
    const marks: number[] = [];
    // Show more tick marks when zoomed in
    const step = Math.max(1, Math.floor(totalTicks / (5 * zoom)));
    for (let t = 0; t < totalTicks; t += step) {
      marks.push(t);
    }
    if (marks[marks.length - 1] !== totalTicks - 1) {
      marks.push(totalTicks - 1);
    }
    return marks;
  }, [totalTicks, zoom]);

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/30 to-pastel-purple/30 opacity-50"></div>
      
      {/* Header */}
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
              Dispatch Timeline &amp; Context Switches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-border-subtle shadow-sm">
            <button
              onClick={doZoomOut}
              disabled={zoom <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={15} className="text-slate-600" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 min-w-[40px] text-center select-none">
              {zoom}x
            </span>
            <button
              onClick={doZoomIn}
              disabled={zoom >= 16}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={15} className="text-slate-600" />
            </button>
            {zoom > 1 && (
              <button
                onClick={doZoomReset}
                className="p-1 rounded hover:bg-slate-100 transition-colors ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw size={13} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-blue-700 font-bold bg-pastel-blue/50 px-3 py-1.5 rounded-full border border-pastel-blue shadow-sm">
            {totalTicks} ticks total
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <Tooltip.Provider delayDuration={100}>
        <div className="relative z-10">
          <div className="flex">
            {/* Y-axis labels */}
            <div className="w-14 shrink-0 flex flex-col bg-white border border-border-subtle rounded-l-lg z-20 shadow-sm">
              {pids.map((pid) => (
                <div
                  key={String(pid)}
                  className="h-10 flex items-center justify-center text-[11px] font-bold font-mono text-slate-600 border-b border-border-subtle last:border-b-0"
                >
                  {pid === null ? 'IDLE' : `P${pid}`}
                </div>
              ))}
              {/* Spacer for time axis */}
              <div className="h-5 border-t border-border-subtle bg-slate-50 rounded-bl-lg"></div>
            </div>

            {/* Scrollable timeline */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto border border-l-0 border-border-subtle rounded-r-lg bg-white"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div
                ref={containerRef}
                onClick={handleTrackClick}
                className="relative flex flex-col cursor-pointer select-none"
                style={{ width: zoom > 1 ? `${zoom * 100}%` : '100%', minWidth: '100%' }}
              >
                {/* Grid lines */}
                {(() => {
                  const gridLines: number[] = [];
                  const gridStep = Math.max(1, Math.floor(totalTicks / (10 * zoom)));
                  for (let t = 0; t < totalTicks; t += gridStep) {
                    gridLines.push(t);
                  }
                  return (
                    <div className="absolute top-0 bottom-5 left-0 right-0 pointer-events-none">
                      {gridLines.map(t => (
                        <div
                          key={t}
                          className="absolute h-full bg-slate-200"
                          style={{ left: `${(t / totalTicks) * 100}%`, width: '1px' }}
                        />
                      ))}
                    </div>
                  );
                })()}

                {/* Process rows */}
                {pids.map((pid) => (
                  <div
                    key={String(pid)}
                    className="relative h-10 border-b border-slate-100 last:border-b-0 w-full"
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
                              transition={{ duration: 0.3, delay: idx * 0.008, ease: 'easeOut' }}
                              className="absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-150 hover:brightness-110 hover:z-10"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: isIdle ? '#e2e8f0' : pidColor(seg.pid),
                                color: isIdle ? '#94a3b8' : '#ffffff',
                                transformOrigin: 'left center',
                                borderRight: '1px solid rgba(255,255,255,0.3)',
                              }}
                            >
                              {widthPct * zoom > 3 && (
                                <span className="truncate px-1 drop-shadow-sm">
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

                {/* Playhead */}
                <motion.div
                  animate={{ left: `${playheadPercent}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute top-0 bottom-5 w-0.5 bg-blue-500 pointer-events-none z-30"
                  style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
                >
                  <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
                  <div className="absolute bottom-1 -left-5 bg-white text-blue-600 border border-pastel-blue text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                    T={currentTick}
                  </div>
                </motion.div>

                {/* Time axis */}
                <div className="h-5 flex items-center border-t border-slate-200 bg-slate-50/80 px-0.5">
                  <div className="relative w-full h-full">
                    {tickMarks.map(t => (
                      <span
                        key={t}
                        className="absolute text-[9px] font-mono text-slate-400 font-semibold -translate-x-1/2"
                        style={{ left: `${(t / (totalTicks - 1)) * 100}%`, top: '2px' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
