import { useMemo, useRef, type ReactNode } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Play, Pause, SkipForward, Rewind } from 'lucide-react';
import { pidColor, IDLE_COLOR_DARK } from '../lib/colors';
import { buildCpuSegments } from '../lib/timeline';

const SPEEDS = [1, 5, 10, 25, 50];

interface PlaybackBarProps {
  // rendered under the timeline (the result tabs)
  children?: ReactNode;
}

// The dark timeline scrubber: the CPU schedule for the whole run doubles as the seek bar
export default function PlaybackBar({ children }: Readonly<PlaybackBarProps>) {
  const { currentTick, isPlaying, togglePlay, setTick, result, speed, setSpeed } = useSimStore();
  const stripRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const snapshots = result?.snapshots ?? [];
  const totalTicks = snapshots.length;
  const maxTick = Math.max(0, totalTicks - 1);
  const segments = useMemo(() => buildCpuSegments(result?.snapshots), [result]);
  const running = snapshots[currentTick]?.running ?? null;

  const tickMarks = useMemo(() => {
    if (totalTicks === 0) return [];
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, t: Math.round(f * maxTick) }));
  }, [totalTicks, maxTick]);

  const seekFromPointer = (clientX: number) => {
    const el = stripRef.current;
    if (!el || totalTicks === 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setTick(Math.round(ratio * maxTick));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowRight') setTick(Math.min(maxTick, currentTick + step));
    else if (e.key === 'ArrowLeft') setTick(Math.max(0, currentTick - step));
    else if (e.key === 'Home') setTick(0);
    else if (e.key === 'End') setTick(maxTick);
    else return;
    e.preventDefault();
  };

  const playheadPct = maxTick > 0 ? (currentTick / maxTick) * 100 : 0;

  return (
    <div className="bg-night text-night-text rounded-xl px-4 pt-3 pb-2 shadow-pop">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTick(0)}
            disabled={!result}
            title="กลับไปจุดเริ่มต้น"
            aria-label="กลับไปจุดเริ่มต้น"
            className="p-1.5 rounded-md text-night-muted hover:text-night-text hover:bg-night-raised disabled:opacity-30 transition-colors"
          >
            <Rewind size={16} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!result}
            title={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
            aria-label={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-soft text-night hover:bg-white disabled:opacity-30 transition-colors"
          >
            {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => setTick(Math.min(currentTick + 1, maxTick))}
            disabled={!result}
            title="เดินหน้า 1 tick"
            aria-label="เดินหน้า 1 tick"
            className="p-1.5 rounded-md text-night-muted hover:text-night-text hover:bg-night-raised disabled:opacity-30 transition-colors"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="text-sm tabular-nums">
          <span className="font-mono">t = {currentTick}</span>
          <span className="text-night-muted"> / {maxTick}</span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-night-muted">
            {running === null ? (
              'CPU ว่าง'
            ) : (
              <>
                กำลังรัน{' '}
                <span className="inline-flex items-center gap-1.5 font-semibold text-night-text">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: pidColor(running) }} />
                  <span className="font-mono">P{running}</span>
                </span>
              </>
            )}
          </span>
          <label className="flex items-center gap-1.5 text-night-muted">
            <span className="sr-only sm:not-sr-only">ความเร็ว</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number.parseInt(e.target.value))}
              className="bg-night-raised text-night-text border border-night-line rounded-md px-2 py-1 text-xs font-mono outline-none focus:border-night-muted"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* CPU timeline strip = seek bar */}
      <div
        ref={stripRef}
        role="slider"
        tabIndex={result ? 0 : -1}
        aria-label="ไทม์ไลน์การจำลอง"
        aria-valuemin={0}
        aria-valuemax={maxTick}
        aria-valuenow={currentTick}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekFromPointer(e.clientX);
        }}
        onPointerMove={(e) => draggingRef.current && seekFromPointer(e.clientX)}
        onPointerUp={() => (draggingRef.current = false)}
        onPointerCancel={() => (draggingRef.current = false)}
        className="relative h-6 cursor-pointer select-none touch-none rounded focus-visible:ring-offset-night"
      >
        {/* keyed on result so the draw-in runs once per simulation run */}
        <div key={totalTicks + ':' + segments.length} className="absolute inset-0 flex gap-px rounded overflow-hidden animate-draw-in">
          {segments.length === 0 ? (
            <div className="flex-1 bg-night-raised" />
          ) : (
            segments.map((seg) => (
              <div
                key={seg.start}
                style={{
                  flexGrow: seg.duration,
                  flexBasis: 0,
                  backgroundColor: seg.pid === null ? IDLE_COLOR_DARK : pidColor(seg.pid),
                }}
                title={seg.pid === null ? `ว่าง t${seg.start}–${seg.end}` : `P${seg.pid} t${seg.start}–${seg.end}`}
              />
            ))
          )}
        </div>
        {result && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 bg-white pointer-events-none"
            style={{ left: `calc(${playheadPct}% - 1px)`, boxShadow: '0 0 0 2px rgb(var(--night))' }}
          />
        )}
      </div>

      <div className="flex justify-between text-[11px] font-mono text-night-muted mt-1 tabular-nums">
        {tickMarks.map(({ f, t }) => (
          <span key={f}>{t}</span>
        ))}
      </div>

      {children && <div className="mt-2 pt-2 border-t border-night-line">{children}</div>}
    </div>
  );
}
