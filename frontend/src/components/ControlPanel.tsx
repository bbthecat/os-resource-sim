import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSimStore } from '../store/useSimStore';
import { runSimulation, fetchWorkloads } from '../api/client';
import { Play, Sliders, RefreshCw, Check } from 'lucide-react';
import { AnimatedSlider } from './AnimatedSlider';

interface Option {
  value: string;
  label: string;
  title?: string;
  hint?: string;
}

const DEFAULT_WORKLOADS = ['mixed', 'cpu_heavy', 'io_heavy', 'memory_hog', 'textbook_examples'];

// Short chip label + full name (shown as tooltip). Unknown names from the API fall back to the raw value.
const WORKLOAD_META: Record<string, { label: string; title: string }> = {
  mixed: { label: 'ผสม', title: 'งานผสมทั่วไป (Mixed)' },
  cpu_heavy: { label: 'CPU หนัก', title: 'ใช้งาน CPU หนัก (CPU Heavy)' },
  io_heavy: { label: 'I/O หนัก', title: 'อ่านเขียนดิสก์หนัก (I/O Heavy)' },
  memory_hog: { label: 'กินแรม', title: 'กินแรมเยอะ / เกิด Thrashing (Memory Hog)' },
  textbook_examples: { label: 'ตำรา', title: 'ตัวอย่างในตำรา (Textbook)' },
};

const SCHEDULERS: Option[] = [
  { value: 'rr', label: 'Round Robin', hint: 'สลับวนตาม quantum', title: 'Round Robin (สลับคิววนรอบ)' },
  { value: 'fcfs', label: 'FCFS', hint: 'มาก่อนได้ก่อน', title: 'First-Come, First-Served' },
  { value: 'sjf', label: 'SJF', hint: 'งานสั้นทำก่อน', title: 'Shortest Job First' },
  { value: 'priority', label: 'Priority', hint: 'ตามความสำคัญ', title: 'Priority scheduling (ตามความสำคัญ)' },
];

const REPLACEMENTS: Option[] = [
  { value: 'lru', label: 'LRU', title: 'Least Recently Used: แทนที่หน้าที่ไม่ได้ใช้นานที่สุด' },
  { value: 'fifo', label: 'FIFO', title: 'First-In, First-Out: แทนที่หน้าที่เข้ามาก่อนสุด' },
  { value: 'clock', label: 'Clock', title: 'Clock / Second Chance: วนหาหน้าที่ reference bit เป็น 0' },
];

/**
 * Roving-tabindex keyboard handling for a radiogroup (WAI-ARIA radio pattern):
 * arrows move focus and selection, Home/End jump to the ends.
 */
function useRadioKeys(options: Option[], value: string, onChange: (v: string) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = options.length;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const tabIndexFor = (i: number) => (i === selectedIndex ? 0 : -1);
  return { refs, onKeyDown, tabIndexFor };
}

interface RadioGroupProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

function ChipGroup({ label, options, value, onChange }: Readonly<RadioGroupProps>) {
  const { refs, onKeyDown, tabIndexFor } = useRadioKeys(options, value, onChange);
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            tabIndex={tabIndexFor(i)}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`rounded-md border px-2.5 py-1.5 text-sm leading-5 transition-colors ${
              on
                ? 'border-primary bg-primary-soft font-semibold text-primary-ink'
                : 'border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function OptionCards({ label, options, value, onChange }: Readonly<RadioGroupProps>) {
  const { refs, onKeyDown, tabIndexFor } = useRadioKeys(options, value, onChange);
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1.5">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            tabIndex={tabIndexFor(i)}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative min-w-0 rounded-lg border px-2.5 py-2 text-left transition-colors ${
              on
                ? 'border-primary bg-primary-soft/40 ring-1 ring-inset ring-primary'
                : 'border-line bg-surface hover:border-line-strong hover:bg-surface-muted'
            }`}
          >
            <span className={`block pr-4 text-sm font-semibold leading-5 ${on ? 'text-primary-ink' : 'text-ink'}`}>
              {o.label}
            </span>
            {o.hint && <span className="block text-xs leading-4 text-muted">{o.hint}</span>}
            {on && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white"
              >
                <Check size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Group({ title, first, children }: Readonly<{ title: string; first?: boolean; children: ReactNode }>) {
  return (
    <section className={first ? 'space-y-2' : 'space-y-2 border-t border-line pt-4'}>
      <h3 className="text-xs font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

export default function ControlPanel() {
  const { config, setConfig, setResult } = useSimStore();
  const [workloads, setWorkloads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkloads()
      .then((data) => {
        if (data && data.length > 0) {
          setWorkloads(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load workloads:', err);
        setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้');
      });
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await runSimulation(config);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || 'เกิดข้อผิดพลาดในการจำลองระบบ');
    }
    setLoading(false);
  };

  // API list wins when available; otherwise the built-in defaults. Unknown names render as-is.
  const workloadNames = [...(workloads.length > 0 ? workloads : DEFAULT_WORKLOADS)];
  // Keep the current selection visible even if it is not in the list (e.g. set by a preset).
  if (config.workload && !workloadNames.includes(config.workload)) {
    workloadNames.push(config.workload);
  }
  const workloadOptions: Option[] = workloadNames.map((w) => {
    const meta = WORKLOAD_META[w];
    return { value: w, label: meta?.label ?? w, title: meta?.title ?? w };
  });

  return (
    <div className="bg-surface border border-line rounded-xl p-4 space-y-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <Sliders size={16} className="text-muted" />
        การตั้งค่า
      </h2>

      {errorMsg && (
        <div
          role="alert"
          className="border-l-[3px] border-danger bg-danger-soft rounded-r-lg px-3 py-2 text-sm text-danger"
        >
          {errorMsg}
        </div>
      )}

      <Group title="งานที่จะรัน" first>
        <ChipGroup
          label="รูปแบบงาน (Workload)"
          options={workloadOptions}
          value={config.workload}
          onChange={(v) => setConfig({ ...config, workload: v })}
        />
      </Group>

      <Group title="CPU scheduling">
        <OptionCards
          label="อัลกอริทึมจัดคิว CPU (Scheduler)"
          options={SCHEDULERS}
          value={config.scheduler}
          onChange={(v) => setConfig({ ...config, scheduler: v })}
        />

        {/* Quantum only applies to Round Robin */}
        {config.scheduler === 'rr' && (
          <div className="pt-2">
            <AnimatedSlider
              value={config.quantum}
              onValueChange={(val) => setConfig({ ...config, quantum: val })}
              min={1}
              max={16}
              color="emerald"
              label="Time quantum"
              unit="ticks"
            />
          </div>
        )}
      </Group>

      <Group title="หน่วยความจำ">
        <AnimatedSlider
          value={config.ram_frames}
          onValueChange={(val) => setConfig({ ...config, ram_frames: val })}
          min={4}
          max={64}
          step={4}
          color="emerald"
          label="ขนาด RAM"
          unit="frames"
        />
        <div className="space-y-1.5 pt-2">
          <span className="block text-sm font-medium text-ink">
            การแทนที่หน้า
          </span>
          <ChipGroup
            label="อัลกอริทึมแทนที่หน้า (Page replacement)"
            options={REPLACEMENTS}
            value={config.replacement}
            onChange={(v) => setConfig({ ...config, replacement: v })}
          />
        </div>
      </Group>

      <button
        type="button"
        onClick={handleSimulate}
        disabled={loading}
        aria-busy={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover rounded-md py-2.5 px-3 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RefreshCw className="animate-spin" size={15} />
            <span>กำลังรันการจำลอง...</span>
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            <span>Run simulation</span>
          </>
        )}
      </button>
    </div>
  );
}
