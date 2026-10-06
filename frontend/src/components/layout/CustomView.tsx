import { useEffect, useState, type ReactNode } from 'react';
import { Check, LayoutGrid } from 'lucide-react';
import ExecutiveSummary from '../ExecutiveSummary';
import BottleneckCard from '../BottleneckCard';
import GaugeRow from '../GaugeRow';
import GanttChart from '../GanttChart';
import QueueLane from '../QueueLane';
import UtilizationChart from '../UtilizationChart';
import MemoryGrid from '../MemoryGrid';
import PageFaultTrace from '../PageFaultTrace';
import ProcessTable from '../ProcessTable';
import EventLog from '../EventLog';

const STORAGE_KEY = 'os-sim.custom-view';
const DEFAULT_PICKS = ['gantt', 'trace', 'gauges'];

interface CustomViewProps {
  onOpenCompare: () => void;
}

// "มุมมองของฉัน": tick any panels from every tab to see them together
export default function CustomView({ onOpenCompare }: Readonly<CustomViewProps>) {
  const panels: { id: string; label: string; node: ReactNode }[] = [
    { id: 'summary', label: 'สรุปผล', node: <ExecutiveSummary /> },
    { id: 'bottleneck', label: 'คอขวด', node: <BottleneckCard onOpenCompare={onOpenCompare} /> },
    { id: 'gauges', label: 'มาตรวัด', node: <GaugeRow /> },
    { id: 'gantt', label: 'CPU Gantt', node: <GanttChart /> },
    { id: 'queues', label: 'คิวโปรเซส', node: <QueueLane /> },
    { id: 'chart', label: 'กราฟเวลา', node: <UtilizationChart /> },
    { id: 'frames', label: 'Memory frames', node: <MemoryGrid /> },
    { id: 'trace', label: 'Page trace', node: <PageFaultTrace /> },
    { id: 'processes', label: 'ตารางโปรเซส', node: <ProcessTable /> },
    { id: 'events', label: 'Event log', node: <EventLog /> },
  ];

  const [picked, setPicked] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (Array.isArray(saved)) return saved.filter((id) => typeof id === 'string');
    } catch {
      // storage unavailable or corrupt — fall back to defaults
    }
    return DEFAULT_PICKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
    } catch {
      // private mode etc. — the view still works for this session
    }
  }, [picked]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const shown = panels.filter((p) => picked.includes(p.id));

  return (
    <div className="space-y-5">
      <fieldset className="bg-surface border border-line rounded-xl px-4 py-3">
        <legend className="sr-only">เลือกส่วนที่จะแสดง</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted mr-1">แสดง</span>
          {panels.map(({ id, label }) => {
            const on = picked.includes(id);
            return (
              <button
                key={id}
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(id)}
                className={`inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border text-sm transition-colors ${
                  on
                    ? 'bg-night border-night text-night-text'
                    : 'bg-surface border-line text-ink hover:border-line-strong hover:bg-surface-muted'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    on ? 'bg-primary-soft border-primary-soft text-night' : 'border-line-strong'
                  }`}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {label}
              </button>
            );
          })}
          {picked.length > 0 && (
            <button
              onClick={() => setPicked([])}
              className="ml-auto text-sm text-muted hover:text-ink underline-offset-2 hover:underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </fieldset>

      {shown.length === 0 ? (
        <div className="border border-dashed border-line-strong rounded-xl py-14 px-6 text-center">
          <LayoutGrid size={22} className="mx-auto text-subtle" />
          <p className="mt-2 font-medium">ยังไม่ได้เลือกส่วนไหน</p>
          <p className="text-sm text-muted">ติ๊กด้านบนเพื่อวางส่วนที่อยากดูไว้ด้วยกัน เช่น Gantt คู่กับ Page trace</p>
        </div>
      ) : (
        shown.map(({ id, node }) => <div key={id}>{node}</div>)
      )}
    </div>
  );
}
