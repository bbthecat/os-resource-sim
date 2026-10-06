import { useMemo, useRef, useState, useEffect } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { GanttChartSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Segment {
  pid: number | null;
  start: number;
  end: number; // inclusive
  duration: number;
}

const VIEW_OPTIONS = [10, 20, 50, 100] as const;

export default function GanttChart() {
  const { result, currentTick, setTick } = useSimStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTicks, setViewTicks] = useState(0); // 0 = show all
  const [viewStart, setViewStart] = useState(0);

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
  const isZoomed = viewTicks > 0;
  const effectiveViewTicks = isZoomed ? Math.min(viewTicks, totalTicks) : totalTicks;
  const viewEnd = Math.min(viewStart + effectiveViewTicks, totalTicks);
  const actualViewTicks = viewEnd - viewStart;

  // Clamp viewStart when changing viewTicks
  useEffect(() => {
    if (isZoomed && viewStart + effectiveViewTicks > totalTicks) {
      setViewStart(Math.max(0, totalTicks - effectiveViewTicks));
    }
  }, [viewTicks, totalTicks, effectiveViewTicks, isZoomed, viewStart]);

  // Filter segments that overlap with the visible range
  const visibleSegments = useMemo(() => {
    if (!isZoomed) return segments;
    return segments.filter(seg => seg.end >= viewStart && seg.start < viewEnd);
  }, [segments, isZoomed, viewStart, viewEnd]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTick = Math.round(viewStart + clickRatio * (actualViewTicks - 1));
    setTick(Math.max(0, Math.min(totalTicks - 1, targetTick)));
  };

  const playheadPercent = actualViewTicks > 1
    ? ((currentTick - viewStart) / (actualViewTicks - 1)) * 100
    : 0;
  const playheadVisible = currentTick >= viewStart && currentTick < viewEnd;

  const canGoLeft = viewStart > 0;
  const canGoRight = viewEnd < totalTicks;
  const goLeft = () => setViewStart(s => Math.max(0, s - Math.floor(effectiveViewTicks / 2)));
  const goRight = () => setViewStart(s => Math.min(totalTicks - effectiveViewTicks, s + Math.floor(effectiveViewTicks / 2)));

  // Navigate to follow playhead
  const goToPlayhead = () => {
    if (!isZoomed) return;
    const newStart = Math.max(0, Math.min(totalTicks - effectiveViewTicks, currentTick - Math.floor(effectiveViewTicks / 2)));
    setViewStart(newStart);
  };

  // Generate tick marks for the time axis
  const tickMarks = useMemo(() => {
    const marks: number[] = [];
    if (actualViewTicks <= 20) {
      // Show every tick
      for (let t = viewStart; t < viewEnd; t++) {
        marks.push(t);
      }
    } else if (actualViewTicks <= 50) {
      // Show every 5 ticks
      const first = Math.ceil(viewStart / 5) * 5;
      for (let t = first; t < viewEnd; t += 5) {
        marks.push(t);
      }
    } else {
      // Show ~10 marks
      const step = Math.max(1, Math.floor(actualViewTicks / 10));
      for (let t = viewStart; t < viewEnd; t += step) {
        marks.push(t);
      }
    }
    return marks;
  }, [viewStart, viewEnd, actualViewTicks]);

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

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Ticks Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-sm">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">View:</span>
            <button
              onClick={() => { setViewTicks(0); setViewStart(0); }}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition-colors ${
                !isZoomed ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {VIEW_OPTIONS.filter(v => v < totalTicks).map(v => (
              <button
                key={v}
                onClick={() => { setViewTicks(v); setViewStart(Math.min(viewStart, Math.max(0, totalTicks - v))); }}
                className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition-colors ${
                  viewTicks === v ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation when zoomed */}
          {isZoomed && (
            <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-lg border border-border-subtle shadow-sm">
              <button
                onClick={goLeft}
                disabled={!canGoLeft}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} className="text-slate-600" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-600 min-w-[80px] text-center">
                T{viewStart}–T{viewEnd - 1}
              </span>
              <button
                onClick={goRight}
                disabled={!canGoRight}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} className="text-slate-600" />
              </button>
              {!playheadVisible && (
                <button
                  onClick={goToPlayhead}
                  className="ml-1 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Go to T={currentTick}
                </button>
              )}
            </div>
          )}

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

            {/* Timeline */}
            <div
              ref={containerRef}
              onClick={handleTrackClick}
              className="flex-1 relative flex flex-col cursor-pointer select-none border border-l-0 border-border-subtle rounded-r-lg bg-white overflow-hidden"
            >
              {/* Grid lines */}
              <div className="absolute top-0 bottom-5 left-0 right-0 pointer-events-none">
                {tickMarks.map(t => (
                  <div
                    key={t}
                    className="absolute h-full"
                    style={{
                      left: `${((t - viewStart) / actualViewTicks) * 100}%`,
                      width: '1px',
                      backgroundColor: actualViewTicks <= 20 ? '#e2e8f0' : '#f1f5f9',
                    }}
                  />
                ))}
              </div>

              {/* Process rows */}
              {pids.map((pid) => (
                <div
                  key={String(pid)}
                  className="relative h-10 border-b border-slate-100 last:border-b-0 w-full"
                >
                  {visibleSegments.filter(s => s.pid === pid).map((seg, idx) => {
                    // Clamp segment to visible range
                    const clampedStart = Math.max(seg.start, viewStart);
                    const clampedEnd = Math.min(seg.end, viewEnd - 1);
                    const clampedDuration = clampedEnd - clampedStart + 1;
                    if (clampedDuration <= 0) return null;

                    const leftPct = ((clampedStart - viewStart) / actualViewTicks) * 100;
                    const widthPct = (clampedDuration / actualViewTicks) * 100;
                    const isIdle = seg.pid === null;

                    return (
                      <Tooltip.Root key={idx}>
                        <Tooltip.Trigger asChild>
                          <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.005, ease: 'easeOut' }}
                            className="absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-150 hover:brightness-110 hover:z-10"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: isIdle ? '#e2e8f0' : pidColor(seg.pid),
                              color: isIdle ? '#94a3b8' : '#ffffff',
                              transformOrigin: 'left center',
                              borderRight: '1px solid rgba(255,255,255,0.3)',
                              borderRadius: 0,
                            }}
                          >
                            {widthPct > 4 && (
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
              {playheadVisible && (
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
              )}

              {/* Time axis */}
              <div className="h-5 flex items-center border-t border-slate-200 bg-slate-50/80 px-0.5">
                <div className="relative w-full h-full">
                  {tickMarks.map(t => (
                    <span
                      key={t}
                      className="absolute text-[9px] font-mono text-slate-400 font-semibold -translate-x-1/2"
                      style={{ left: `${((t - viewStart) / (actualViewTicks - 1)) * 100}%`, top: '2px' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
