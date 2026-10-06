import { useEffect, useState, type ReactNode } from 'react';
import { useSimStore } from '../store/useSimStore';
import { runSimulation, fetchWorkloads } from '../api/client';
import { Play, Sliders, RefreshCw } from 'lucide-react';
import { AnimatedSlider } from './AnimatedSlider';

const SELECT =
  'w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-sm text-ink hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

function Field({ id, label, hint, children }: Readonly<FieldProps>) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-muted">{hint}</span>}
      </label>
      {children}
    </div>
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

  const getWorkloadLabel = (w: string) => {
    switch (w) {
      case 'mixed':
        return 'งานผสมทั่วไป (Mixed)';
      case 'cpu_heavy':
        return 'ใช้งาน CPU หนัก (CPU Heavy)';
      case 'io_heavy':
        return 'อ่านเขียนดิสก์หนัก (I/O Heavy)';
      case 'memory_hog':
        return 'กินแรมเยอะ / เกิด Thrashing (Memory Hog)';
      case 'textbook_examples':
        return 'ตัวอย่างในตำรา (Textbook)';
      default:
        return w;
    }
  };

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

      <div className="space-y-4">
        <Field id="cp-workload" label="รูปแบบงาน" hint="Workload">
          <select
            id="cp-workload"
            value={config.workload}
            onChange={(e) => setConfig({ ...config, workload: e.target.value })}
            className={SELECT}
          >
            {workloads.length > 0 ? (
              workloads.map((w) => (
                <option key={w} value={w}>
                  {getWorkloadLabel(w)}
                </option>
              ))
            ) : (
              <>
                <option value="mixed">งานผสมทั่วไป (Mixed)</option>
                <option value="cpu_heavy">ใช้งาน CPU หนัก (CPU Heavy)</option>
                <option value="io_heavy">อ่านเขียนดิสก์หนัก (I/O Heavy)</option>
                <option value="memory_hog">กินแรมเยอะ (Memory Hog)</option>
                <option value="textbook_examples">ตัวอย่างในตำรา (Textbook)</option>
              </>
            )}
          </select>
        </Field>

        <Field id="cp-scheduler" label="อัลกอริทึมจัดคิว CPU" hint="Scheduler">
          <select
            id="cp-scheduler"
            value={config.scheduler}
            onChange={(e) => setConfig({ ...config, scheduler: e.target.value })}
            className={SELECT}
          >
            <option value="rr">Round Robin (สลับคิววนรอบ)</option>
            <option value="fcfs">FCFS (มาก่อนได้ก่อน)</option>
            <option value="priority">Priority (ตามความสำคัญ)</option>
            <option value="sjf">SJF (งานสั้นทำก่อน)</option>
          </select>
        </Field>

        {/* Quantum only applies to Round Robin */}
        {config.scheduler === 'rr' && (
          <AnimatedSlider
            value={config.quantum}
            onValueChange={(val) => setConfig({ ...config, quantum: val })}
            min={1}
            max={16}
            color="emerald"
            label="Time quantum"
            unit="ticks"
          />
        )}

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

        <Field id="cp-replacement" label="อัลกอริทึมแทนที่หน้า" hint="Page replacement">
          <select
            id="cp-replacement"
            value={config.replacement}
            onChange={(e) => setConfig({ ...config, replacement: e.target.value })}
            className={SELECT}
          >
            <option value="lru">LRU (Least Recently Used)</option>
            <option value="fifo">FIFO (First-In, First-Out)</option>
            <option value="clock">Clock / Second Chance</option>
          </select>
        </Field>
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
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
