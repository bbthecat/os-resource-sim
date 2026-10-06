import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Layers, MousePointerClick, Radio, ListOrdered } from 'lucide-react';

type PidFilter = number | 'all';

interface TraceStep {
  tick: number;
  // tick at which the frames shown in this column exist (load tick for misses)
  shownAt: number;
  pid: number;
  pageRequested: number;
  isHit: boolean;
  framesState: (number | null)[];
  frameOwners: (number | null)[];
}

// What a frame shows in one column for the current process filter: `page:owner`, or null when blank
function cellKey(trace: TraceStep, frameIdx: number, pid: PidFilter): string | null {
  const page = trace.framesState[frameIdx];
  const owner = trace.frameOwners[frameIdx];
  if (page === null || page === undefined || owner === null || owner === undefined) return null;
  if (pid !== 'all' && owner !== pid) return null;
  return `${page}:${owner}`;
}

export default function PageFaultTrace() {
  const { result, currentTick } = useSimStore();
  // null = not chosen yet (defaults to the first process); 'all' mixes processes, so it is opt-in
  const [pidChoice, setPidChoice] = useState<PidFilter | null>(null);
  const [followTimeline, setFollowTimeline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestColRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

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

  // Fall back to the first process when nothing is chosen or the chosen one is not in this result
  const selectedPid: PidFilter =
    pidChoice === 'all'
      ? 'all'
      : pidChoice !== null && pidsWithMemory.includes(pidChoice)
        ? pidChoice
        : (pidsWithMemory[0] ?? 'all');

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
                shownAt: snap.t,
                pid: evPid,
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
                shownAt: snap.t,
                pid: evPid,
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

  // Only the columns that have happened by the playhead when following the timeline
  const visibleTraces = useMemo(
    () => (followTimeline ? traces.filter(t => t.shownAt <= currentTick) : traces),
    [traces, followTimeline, currentTick]
  );
  const latestShownAt = followTimeline && visibleTraces.length > 0
    ? Math.max(...visibleTraces.map(t => t.shownAt))
    : null;
  const latestIdx = latestShownAt === null ? -1 : visibleTraces.findIndex(t => t.shownAt === latestShownAt);

  const numFrames = result?.config.ram_frames ?? 0;
  // Frames that hold something (for this process filter) in at least one visible column, in frame order
  const shownFrames = useMemo(() => {
    const used: number[] = [];
    for (let f = 0; f < numFrames; f++) {
      if (visibleTraces.some(t => cellKey(t, f, selectedPid) !== null)) used.push(f);
    }
    return used;
  }, [visibleTraces, numFrames, selectedPid]);

  // Keep the newest column in view horizontally (never scrolls the page vertically)
  useEffect(() => {
    const box = scrollRef.current;
    const col = latestColRef.current;
    if (!followTimeline || !box || !col) return;
    const colLeft = col.offsetLeft;
    const colRight = colLeft + col.offsetWidth;
    // the sticky frame-index gutter covers the left edge, so treat it as off-screen
    const gutter = gutterRef.current?.offsetWidth ?? 0;
    if (colRight > box.scrollLeft + box.clientWidth - 24) {
      box.scrollLeft = colRight - box.clientWidth + 24;
    } else if (colLeft < box.scrollLeft + gutter) {
      box.scrollLeft = Math.max(0, colLeft - gutter - 24);
    }
  }, [followTimeline, latestIdx, visibleTraces.length]);

  if (!result) return null;

  const totalFaults = visibleTraces.filter(t => !t.isHit).length;
  const modes = [
    { id: true, label: 'ตาม timeline', Icon: Radio },
    { id: false, label: 'ทั้งหมด', Icon: ListOrdered },
  ];

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Layers size={16} className="text-muted" />
            Page replacement trace
          </h3>
          <p className="mt-0.5 text-sm text-muted">ประวัติการเข้าถึงหน่วยความจำ แยกเป็น hit และ miss</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <fieldset className="inline-flex bg-surface-muted p-1 rounded-lg">
            <legend className="sr-only">ช่วงเวลาที่แสดง</legend>
            {modes.map(({ id, label, Icon }) => {
              const selected = followTimeline === id;
              return (
                <button
                  key={label}
                  onClick={() => setFollowTimeline(id)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                    selected ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </fieldset>

          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            <span>Process</span>
            <select
              className="bg-surface border border-line rounded-md px-2.5 py-1.5 text-sm text-ink cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={selectedPid}
              onChange={(e) => setPidChoice(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">All processes</option>
              {pidsWithMemory.map(pid => (
                <option key={pid} value={pid}>Process P{pid}</option>
              ))}
            </select>
          </label>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1 whitespace-nowrap">
            Total faults
            <span className="font-mono tabular-nums">{totalFaults}</span>
          </span>
        </div>
      </div>

      {traces.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-subtle text-sm">
          <MousePointerClick size={24} className="mb-2" />
          <p>No memory access trace available</p>
          <p className="text-xs mt-1">Try a workload that uses memory (e.g. Memory Hog)</p>
        </div>
      ) : (
        <div ref={scrollRef} className="relative bg-surface py-4 pr-4 rounded-lg border border-line overflow-x-auto">
          {/* full scroll width, so the sticky labels below stay pinned while the table scrolls */}
          <div className="w-max min-w-full">
          <div className="flex items-center mb-4 gap-3">
            <span className="sticky left-0 z-10 bg-surface pl-4 pr-3 text-primary-ink text-base leading-tight font-semibold">Page<br/>reference</span>
            <span className="text-primary-ink text-base tracking-wide font-semibold font-mono tabular-nums whitespace-nowrap">
              {visibleTraces.length > 0 ? visibleTraces.map(t => t.pageRequested).join(',') : '–'}
            </span>
          </div>

          {visibleTraces.length === 0 && (
            <p className="sticky left-0 w-max pl-4 pb-4 text-sm text-muted">
              ยังไม่มีการเข้าถึงหน่วยความจำจนถึง tick <span className="font-mono tabular-nums">{currentTick}</span> กดเล่นหรือเลื่อน timeline เพื่อดูต่อ
            </p>
          )}

          {visibleTraces.length > 0 && shownFrames.length < numFrames && (
            <p className="sticky left-0 w-max pl-4 mb-3 text-xs text-muted">
              แสดง <span className="font-mono tabular-nums">{shownFrames.length}</span> จาก{' '}
              <span className="font-mono tabular-nums">{numFrames}</span> เฟรม (ซ่อนเฟรมที่ว่างตลอดช่วงนี้)
            </p>
          )}

          {visibleTraces.length > 0 && (
          <div className="flex items-start gap-1.5 pt-1 pb-2">
            {/* frame index gutter, pinned left like the Page reference label */}
            <div ref={gutterRef} className="sticky left-0 z-10 self-stretch bg-surface flex flex-col gap-1 pl-4 pr-1.5 shrink-0" aria-hidden>
              <div className="h-5" />
              <div className="border-y border-transparent">
                {shownFrames.map(f => (
                  <div key={f} className="h-[26px] flex items-center justify-end text-xs font-mono tabular-nums text-subtle">
                    F{f}
                  </div>
                ))}
              </div>
            </div>

            {visibleTraces.map((trace, idx) => {
              const prev = idx > 0 ? visibleTraces[idx - 1] : null;
              return (
              <div
                key={`${trace.tick}-${trace.pid}-${idx}`}
                ref={idx === latestIdx ? latestColRef : undefined}
                className={`flex flex-col items-center gap-1 w-8 shrink-0 relative group rounded-md ${
                  idx === latestIdx ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''
                }`}
              >
                {/* Optional tick tooltip */}
                <div className="absolute -top-5 text-xs font-mono tabular-nums text-subtle opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">T{trace.tick}</div>

                <div className="h-5 leading-5 text-sm font-semibold font-mono tabular-nums text-primary-ink">{trace.pageRequested}</div>

                <div className="w-full flex flex-col rounded-md border border-line-strong overflow-hidden bg-surface">
                  {shownFrames.map(frameIdx => {
                    const page = trace.framesState[frameIdx];
                    const owner = trace.frameOwners[frameIdx];
                    const key = cellKey(trace, frameIdx, selectedPid);
                    // The frame that holds the requested page: tinted as a fault or a hit
                    const isRequested = key !== null && page === trace.pageRequested && owner === trace.pid;
                    // Same page and owner as this frame in the previous column: carried over, so faded
                    const isStale = key !== null && prev !== null && cellKey(prev, frameIdx, selectedPid) === key;
                    let tone: string;
                    if (isRequested) tone = trace.isHit ? 'bg-primary-soft text-primary-ink font-semibold' : 'bg-danger-soft text-danger font-semibold';
                    else if (isStale) tone = 'text-subtle font-normal';
                    else tone = 'text-ink font-semibold';

                    return (
                      <div
                        key={frameIdx}
                        className={`h-[26px] border-b border-line last:border-b-0 flex items-center justify-center text-sm font-mono tabular-nums ${tone}`}
                        title={key !== null ? `F${frameIdx} P${owner}` : `F${frameIdx}`}
                      >
                        {key !== null ? page : ''}
                      </div>
                    );
                  })}
                </div>

                <div className={`text-[11px] leading-4 font-semibold ${trace.isHit ? 'text-primary-ink' : 'text-danger'}`}>
                  {trace.isHit ? 'Hit' : 'Miss'}
                </div>
              </div>
              );
            })}
            {/* end spacer: padding-right and zero-height boxes do not count toward scroll width, so the latest column ring would clip */}
            <div className="w-2 h-px shrink-0" aria-hidden />
          </div>
          )}

          <div className="sticky left-0 w-max mt-4 pl-4 pr-4 bg-surface text-primary-ink font-semibold space-y-0.5">
            <div className="text-base">
              No. of Page frame = <span className="font-mono tabular-nums">{numFrames}</span>
            </div>
            <div className="text-lg">
              Total Page Fault = <span className="font-mono tabular-nums">{totalFaults}</span>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
}
