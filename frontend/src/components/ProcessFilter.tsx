import { useSimStore } from '../store/useSimStore';
import { pidColor } from '../lib/colors';

// Process filter chips; lives on the dark timeline bar so it applies to every tab
export default function ProcessFilter() {
  const { result, hiddenPids, togglePid, showAllPids } = useSimStore();
  const pids: number[] = (result?.metrics?.per_process ?? [])
    .map((p: any) => p.pid as number)
    .sort((a: number, b: number) => a - b);

  if (pids.length === 0) return null;

  return (
    <div role="group" aria-label="กรองโปรเซส" className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-night-muted mr-1">โปรเซส</span>
      {pids.map((pid) => {
        const shown = !hiddenPids.includes(pid);
        return (
          <button
            key={pid}
            onClick={() => togglePid(pid)}
            aria-pressed={shown}
            title={shown ? `ซ่อน P${pid}` : `แสดง P${pid}`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
              shown ? 'bg-night-raised text-night-text hover:bg-night-line' : 'text-night-muted/60 hover:text-night-muted line-through'
            }`}
          >
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: shown ? pidColor(pid) : 'transparent', boxShadow: shown ? undefined : `inset 0 0 0 1px ${pidColor(pid)}` }}
            />
            P{pid}
          </button>
        );
      })}
      {hiddenPids.length > 0 && (
        <button onClick={showAllPids} className="ml-1 text-xs text-night-muted hover:text-night-text underline underline-offset-2">
          แสดงทั้งหมด
        </button>
      )}
    </div>
  );
}
