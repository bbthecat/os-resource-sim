import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { Layers } from 'lucide-react';

export default function MemoryGrid() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  const current = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!current) return null;

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Layers size={16} className="text-muted" />
            ตารางจัดสรรช่องหน่วยความจำกายภาพ
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            แรมมีทั้งหมด <span className="font-mono tabular-nums">{current.frames.length}</span> physical frames
            แต่ละช่องแสดงโปรเซสที่ครอบครองอยู่
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-surface-muted border border-line inline-block" />
            <span>ว่าง</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-primary-soft border border-primary/60 inline-block" />
            <span>มีโปรเซสใช้งาน</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
        {current.frames.map((ownerPid, idx) => {
          const isOccupied = ownerPid !== null;
          const color = pidColor(ownerPid);
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md border text-center transition-colors ${
                isOccupied ? '' : 'bg-surface-muted border-line text-subtle'
              }`}
              style={
                isOccupied
                  ? { backgroundColor: `${color}1F`, borderColor: `${color}80` }
                  : undefined
              }
            >
              <span className="text-xs text-subtle font-mono tabular-nums">F{idx}</span>
              <span
                className="font-mono font-semibold text-xs mt-0.5"
                style={isOccupied ? { color } : undefined}
              >
                {isOccupied ? `P${ownerPid}` : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
