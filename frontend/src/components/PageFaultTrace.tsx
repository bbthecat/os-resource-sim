import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Layers, MousePointerClick, Radio, ListOrdered } from 'lucide-react';

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

export default function PageFaultTrace() {
  const { result, currentTick } = useSimStore();
  const [selectedPid, setSelectedPid] = useState<number | 'all'>('all');
  const [followTimeline, setFollowTimeline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestColRef = useRef<HTMLDivElement>(null);

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

  // Keep the newest column in view horizontally (never scrolls the page vertically)
  useEffect(() => {
    const box = scrollRef.current;
    const col = latestColRef.current;
    if (!followTimeline || !box || !col) return;
    const colLeft = col.offsetLeft;
    const colRight = colLeft + col.offsetWidth;
    if (colRight > box.scrollLeft + box.clientWidth - 24) {
      box.scrollLeft = colRight - box.clientWidth + 24;
    } else if (colLeft < box.scrollLeft) {
      box.scrollLeft = Math.max(0, colLeft - 24);
    }
  }, [followTimeline, latestIdx, visibleTraces.length]);

  if (!result) return null;

  const totalFaults = visibleTraces.filter(t => !t.isHit).length;
  const modes = [
    { id: true, label: 'ตาม timeline', Icon: Radio },
    { id: false, label: 'ทั้งหมด', Icon: ListOrdered },
  ];
  const numFrames = result.config.ram_frames;

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
              onChange={(e) => setSelectedPid(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
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
        <div ref={scrollRef} className="relative bg-surface p-6 rounded-lg border border-line overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-2 gap-4">
            <div className="flex items-center gap-4">
              <span className="text-primary-ink text-lg leading-tight font-semibold">Page<br/>reference</span>
              <span className="text-primary-ink text-lg ml-2 sm:ml-4 tracking-widest font-semibold font-mono tabular-nums">
                {visibleTraces.length > 0 ? visibleTraces.map(t => t.pageRequested).join(',') : '–'}
              </span>
            </div>
            <span className="text-primary-ink text-lg font-semibold">
              No. of Page frame - <span className="font-mono tabular-nums">{numFrames}</span>
            </span>
          </div>

          {visibleTraces.length === 0 && (
            <p className="ml-16 pb-4 text-sm text-muted">
              ยังไม่มีการเข้าถึงหน่วยความจำจนถึง tick <span className="font-mono tabular-nums">{currentTick}</span> กดเล่นหรือเลื่อน timeline เพื่อดูต่อ
            </p>
          )}

          <div className="flex items-start gap-4 sm:gap-6 ml-16 pb-4">
            {visibleTraces.map((trace, idx) => (
              <div
                key={`${trace.tick}-${trace.pid}-${idx}`}
                ref={idx === latestIdx ? latestColRef : undefined}
                className={`flex flex-col items-center w-10 sm:w-12 shrink-0 relative group rounded-md ${
                  idx === latestIdx ? 'ring-2 ring-primary ring-offset-4 ring-offset-surface' : ''
                }`}
              >
                {/* Optional tick tooltip */}
                <div className="absolute -top-6 text-xs font-mono tabular-nums text-subtle opacity-0 group-hover:opacity-100 transition-opacity">T{trace.tick}</div>

                <div className="text-primary-ink text-lg mb-2 font-semibold font-mono tabular-nums">{trace.pageRequested}</div>

                <div className="border border-line-strong flex flex-col w-full bg-surface">
                  {Array.from({ length: numFrames }).map((_, frameIdx) => {
                    const page = trace.framesState[frameIdx];
                    const owner = trace.frameOwners[frameIdx];
                    // If we are looking at a specific process, only show its pages
                    const isOwnerMatch = selectedPid === 'all' || owner === selectedPid;
                    const displayVal = (page !== null && owner !== null && isOwnerMatch) ? page : '';
                    // The frame that holds the requested page: tinted as a fault or a hit
                    const isRequested = displayVal !== '' && page === trace.pageRequested && owner === trace.pid;
                    let tone = 'text-primary-ink';
                    if (isRequested) tone = trace.isHit ? 'bg-primary-soft text-primary-ink' : 'bg-danger-soft text-danger';

                    return (
                      <div
                        key={frameIdx}
                        className={`h-10 sm:h-12 border-b border-line flex items-center justify-center text-lg font-semibold font-mono tabular-nums last:border-b-0 ${tone}`}
                        title={owner !== null ? `P${owner}` : undefined}
                      >
                        {displayVal}
                      </div>
                    );
                  })}
                </div>

                <div className={`mt-4 text-sm sm:text-base font-semibold ${trace.isHit ? 'text-primary-ink' : 'text-danger'}`}>
                  {trace.isHit ? 'Hit' : 'Miss'}
                </div>
              </div>
            ))}
            {/* end spacer: padding-right and zero-height boxes do not count toward scroll width, so the latest column ring would clip */}
            <div className="w-2 h-px shrink-0" aria-hidden />
          </div>

          <div className="mt-8 text-primary-ink text-xl px-2 font-semibold">
            Total Page Fault = <span className="font-mono tabular-nums">{totalFaults}</span>
          </div>
        </div>
      )}
    </section>
  );
}
