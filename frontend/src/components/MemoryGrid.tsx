import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';
import { Layers } from 'lucide-react';

export default function MemoryGrid() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  const current = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!current) return null;

  return (
    <div className="glass-panel border border-border-subtle rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-pastel-green/30 rounded-lg shadow-sm border border-pastel-green">
            <Layers className="text-emerald-600" size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide">
              ตารางจัดสรรช่องหน่วยความจำกายภาพ ({current.frames.length} Physical Frames)
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">
              RAM PAGE-FRAME TABLE & ALLOCATION MATRIX
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono font-semibold">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300 inline-block" />
            <span>FREE</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
            <span>OCCUPIED</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 pt-0.5">
        {current.frames.map((ownerPid, idx) => {
          const isOccupied = ownerPid !== null;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center p-1.5 rounded-md border text-center transition-all ${
                isOccupied
                  ? 'border-transparent shadow-sm'
                  : 'bg-slate-50 border-border-subtle text-slate-400'
              }`}
              style={{
                backgroundColor: isOccupied ? `${pidColor(ownerPid)}25` : undefined,
                borderColor: isOccupied ? pidColor(ownerPid) : undefined,
              }}
            >
              <span className="text-[9px] text-slate-500 font-mono font-bold">F{idx}</span>
              <span 
                className="font-mono font-bold text-xs mt-0.5"
                style={{ color: isOccupied ? pidColor(ownerPid) : '#94a3b8' }}
              >
                {isOccupied ? `P${ownerPid}` : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
