import { useMemo, useRef, useState, useEffect } from 'react';
import { useSimStore } from '../store/useSimStore';
import { pidColor, IDLE_COLOR } from '../lib/colors';
import { buildCpuSegments } from '../lib/timeline';
import { GanttChartSquare, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

const VIEW_OPTIONS = [10, 20, 50, 100] as const;

const SEGMENT_ITEM = 'px-2.5 py-1 text-xs font-medium rounded-md tabular-nums transition-colors';
const SEGMENT_ON = 'bg-surface text-ink shadow-card';
const SEGMENT_OFF = 'text-muted hover:text-ink';

const NAV_BUTTON =
  'p-1 rounded-md text-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

export default function GanttChart() {
  const { result, currentTick, setTick, isPlaying } = useSimStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTicks, setViewTicks] = useState(0); // 0 = show all
  const [viewStart, setViewStart] = useState(0);
  // when zoomed, flip to the chunk holding the playhead; manual paging pauses this
  const [follow, setFollow] = useState(true);

  const segments = useMemo(() => buildCpuSegments(result?.snapshots), [result]);

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

  const totalTicks = result?.snapshots?.length ?? 0;
  const isZoomed = viewTicks > 0;
  const effectiveViewTicks = isZoomed ? Math.min(viewTicks, totalTicks) : totalTicks;
  const viewEnd = Math.min(viewStart + effectiveViewTicks, totalTicks);
  const actualViewTicks = viewEnd - viewStart;

  // Clamp viewStart when changing viewTicks
  useEffect(() => {
    if (totalTicks === 0) return;
    if (isZoomed && viewStart + effectiveViewTicks > totalTicks) {
      setViewStart(Math.max(0, totalTicks - effectiveViewTicks));
    }
  }, [viewTicks, totalTicks, effectiveViewTicks, isZoomed, viewStart]);

  // Start of the chunk that contains a tick, clamped so the window stays full
  const chunkStartFor = (tick: number) =>
    Math.max(0, Math.min(totalTicks - effectiveViewTicks, Math.floor(tick / effectiveViewTicks) * effectiveViewTicks));

  // Follow the playhead: flip a whole chunk once it leaves the window (stable blocks, no per-tick jitter)
  useEffect(() => {
    if (!isZoomed || !follow || totalTicks === 0) return;
    if (currentTick < viewStart || currentTick >= viewStart + effectiveViewTicks) {
      setViewStart(chunkStartFor(currentTick));
    }
  }, [currentTick, follow, isZoomed, viewStart, effectiveViewTicks, totalTicks]);

  // Pressing play means "watch it run" — resume following
  useEffect(() => {
    if (isPlaying) setFollow(true);
  }, [isPlaying]);

  // Filter segments that overlap with the visible range
  const visibleSegments = useMemo(() => {
    if (!isZoomed) return segments;
    return segments.filter(seg => seg.end >= viewStart && seg.start < viewEnd);
  }, [segments, isZoomed, viewStart, viewEnd]);

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

  if (!result || segments.length === 0) return null;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    // each tick owns one equal-width cell, same as the blocks
    const targetTick = viewStart + Math.min(actualViewTicks - 1, Math.floor(clickRatio * actualViewTicks));
    setTick(Math.max(0, Math.min(totalTicks - 1, targetTick)));
  };

  // centre of the tick's cell, so the line sits inside the block that is running now
  const tickCenterPct = (t: number) =>
    actualViewTicks > 0 ? ((t - viewStart + 0.5) / actualViewTicks) * 100 : 0;
  const playheadPercent = tickCenterPct(currentTick);
  const playheadVisible = currentTick >= viewStart && currentTick < viewEnd;
  // anchor the playhead label inward near the edges so it never gets clipped
  let playheadLabelShift = '-50%';
  if (playheadPercent > 92) playheadLabelShift = '-100%';
  else if (playheadPercent < 8) playheadLabelShift = '0';

  const canGoLeft = viewStart > 0;
  const canGoRight = viewEnd < totalTicks;
  const goLeft = () => {
    setFollow(false);
    setViewStart(s => Math.max(0, s - Math.floor(effectiveViewTicks / 2)));
  };
  const goRight = () => {
    setFollow(false);
    setViewStart(s => Math.min(totalTicks - effectiveViewTicks, s + Math.floor(effectiveViewTicks / 2)));
  };

  // Jump back to the playhead and keep following it
  const resumeFollow = () => {
    setFollow(true);
    setViewStart(chunkStartFor(currentTick));
  };

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <GanttChartSquare size={16} className="text-muted" />
            CPU execution timeline
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            process ไหนได้ใช้ CPU ช่วงไหน และสลับกันเมื่อใด (context switch)
          </p>
        </div>

        <span className="self-start shrink-0 px-2.5 py-1 rounded-full bg-surface-muted text-xs text-muted tabular-nums">
          รวม <span className="font-mono text-ink">{totalTicks}</span> ticks
        </span>
      </div>

      {/* View controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Ticks Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">แสดง</span>
          <div className="flex items-center bg-surface-muted p-1 rounded-lg">
            <button
              onClick={() => { setViewTicks(0); setViewStart(0); }}
              aria-pressed={!isZoomed}
              className={`${SEGMENT_ITEM} ${!isZoomed ? SEGMENT_ON : SEGMENT_OFF}`}
            >
              All
            </button>
            {VIEW_OPTIONS.filter(v => v < totalTicks).map(v => (
              <button
                key={v}
                onClick={() => {
                  setViewTicks(v);
                  const span = Math.min(v, totalTicks);
                  setViewStart(
                    follow
                      ? Math.max(0, Math.min(totalTicks - span, Math.floor(currentTick / span) * span))
                      : Math.min(viewStart, Math.max(0, totalTicks - v))
                  );
                }}
                aria-pressed={viewTicks === v}
                className={`${SEGMENT_ITEM} ${viewTicks === v ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation when zoomed */}
        {isZoomed && (
          <div className="flex items-center gap-1">
            <button
              onClick={goLeft}
              disabled={!canGoLeft}
              aria-label="ช่วงก่อนหน้า"
              title="ช่วงก่อนหน้า"
              className={NAV_BUTTON}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono text-ink tabular-nums min-w-[80px] text-center">
              T{viewStart}–T{viewEnd - 1}
            </span>
            <button
              onClick={goRight}
              disabled={!canGoRight}
              aria-label="ช่วงถัดไป"
              title="ช่วงถัดไป"
              className={NAV_BUTTON}
            >
              <ChevronRight size={16} />
            </button>
            {follow ? (
              <span className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-primary-soft text-primary-ink">
                <Crosshair size={13} />
                ติดตามเวลาอยู่
              </span>
            ) : (
              <button
                onClick={resumeFollow}
                className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-surface border border-line text-ink hover:bg-surface-muted hover:border-line-strong transition-colors"
              >
                <Crosshair size={13} className="text-primary" />
                ติดตามเวลา <span className="font-mono tabular-nums text-muted">T={currentTick}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gantt Chart */}
      <Tooltip.Provider delayDuration={100}>
        <div className="flex">
          {/* Y-axis labels */}
          <div className="w-14 shrink-0 flex flex-col bg-surface-muted/50 border border-line rounded-l-lg">
            {pids.map((pid) => (
              <div
                key={String(pid)}
                className={`h-10 flex items-center justify-center text-xs font-medium text-muted border-b border-line last:border-b-0 ${
                  pid === null ? '' : 'font-mono'
                }`}
              >
                {pid === null ? 'ว่าง' : `P${pid}`}
              </div>
            ))}
            {/* Spacer for time axis */}
            <div className="h-5 border-t border-line rounded-bl-lg"></div>
          </div>

          {/* Timeline */}
          <div
            ref={containerRef}
            onClick={handleTrackClick}
            className="flex-1 relative flex flex-col cursor-pointer select-none border border-l-0 border-line rounded-r-lg bg-surface overflow-hidden"
          >
            {/* Grid lines */}
            <div className="absolute top-0 bottom-5 left-0 right-0 pointer-events-none">
              {tickMarks.map(t => (
                <div
                  key={t}
                  className={`absolute h-full w-px ${actualViewTicks <= 20 ? 'bg-line' : 'bg-line/50'}`}
                  style={{ left: `${((t - viewStart) / actualViewTicks) * 100}%` }}
                />
              ))}
            </div>

            {/* Process rows */}
            {pids.map((pid) => (
              <div
                key={String(pid)}
                className="relative h-10 border-b border-line/60 last:border-b-0 w-full"
              >
                {visibleSegments.filter(s => s.pid === pid).map((seg) => {
                  // Clamp segment to visible range
                  const clampedStart = Math.max(seg.start, viewStart);
                  const clampedEnd = Math.min(seg.end, viewEnd - 1);
                  const clampedDuration = clampedEnd - clampedStart + 1;
                  if (clampedDuration <= 0) return null;

                  const leftPct = ((clampedStart - viewStart) / actualViewTicks) * 100;
                  const widthPct = (clampedDuration / actualViewTicks) * 100;
                  const isIdle = seg.pid === null;

                  return (
                    <Tooltip.Root key={seg.start}>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`absolute top-1 bottom-1 flex items-center justify-center rounded-[3px] text-xs font-medium font-mono overflow-hidden transition-[filter] duration-150 hover:brightness-110 hover:z-10 ${
                            isIdle ? 'text-muted' : 'text-white'
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: isIdle ? IDLE_COLOR : pidColor(seg.pid),
                          }}
                        >
                          {widthPct > 4 && (
                            <span className="truncate px-1">
                              {isIdle ? 'ว่าง' : `P${seg.pid}`}
                            </span>
                          )}
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-surface border border-line shadow-pop rounded-md text-ink text-xs px-3 py-2 flex flex-col gap-0.5 z-50 animate-fade-in"
                          sideOffset={5}
                        >
                          <div className="font-semibold mb-1 pb-1 border-b border-line">
                            {isIdle ? 'CPU ว่าง' : <>Process <span className="font-mono">P{seg.pid}</span></>}
                          </div>
                          <div className="tabular-nums">
                            <span className="text-muted">Start</span> <span className="font-mono">T+{seg.start}</span>
                          </div>
                          <div className="tabular-nums">
                            <span className="text-muted">End</span> <span className="font-mono">T+{seg.end}</span>
                          </div>
                          <div className="tabular-nums">
                            <span className="text-muted">Duration</span> <span className="font-mono">{seg.duration}</span> ticks
                          </div>
                          <Tooltip.Arrow className="fill-surface" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  );
                })}
              </div>
            ))}

            {/* Current-tick marker */}
            {playheadVisible && (
              <div
                className="absolute top-0 bottom-5 w-0.5 -ml-px bg-ink pointer-events-none z-30 transition-[left] duration-150 ease-out"
                style={{ left: `${playheadPercent}%` }}
              >
                <div
                  className="absolute bottom-1 left-1/2 bg-ink text-surface text-[11px] font-mono leading-4 px-1.5 rounded tabular-nums whitespace-nowrap"
                  style={{ transform: `translateX(${playheadLabelShift})` }}
                >
                  T={currentTick}
                </div>
              </div>
            )}

            {/* Time axis */}
            <div className="h-5 flex items-center border-t border-line bg-surface-muted/50 px-0.5">
              <div className="relative w-full h-full">
                {tickMarks.map(t => (
                  <span
                    key={t}
                    className="absolute text-[11px] leading-4 font-mono text-subtle tabular-nums"
                    style={{
                      left: `${tickCenterPct(t)}%`,
                      top: '2px',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Tooltip.Provider>
    </section>
  );
}
