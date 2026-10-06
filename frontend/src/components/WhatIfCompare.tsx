import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismiss, backdropDismiss } from '../hooks/useDismiss';
import { useSimStore } from '../store/useSimStore';
import { compareSimulations, CompareResult } from '../api/client';
import { SimConfig } from '../types/sim';
import { GitCompare, TrendingUp, TrendingDown, Minus, RefreshCw, X, ArrowRight } from 'lucide-react';

interface WhatIfCompareProps {
  isOpen: boolean;
  onClose: () => void;
}

const INPUT =
  'w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-sm text-ink hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors';

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors';

// A = baseline (primary), B = the variant being tested (info)
const SIDE_PILL: Record<'A' | 'B', string> = {
  A: 'bg-primary-soft text-primary-ink',
  B: 'bg-info-soft text-info',
};

function SidePill({ side }: Readonly<{ side: 'A' | 'B' }>) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shrink-0 ${SIDE_PILL[side]}`}
    >
      {side}
    </span>
  );
}

interface ConfigCardProps {
  side: 'A' | 'B';
  title: string;
  subtitle: string;
  config: SimConfig;
  onChange: (config: SimConfig) => void;
  ramFallback: number;
}

function ConfigCard({ side, title, subtitle, config, onChange, ramFallback }: Readonly<ConfigCardProps>) {
  const id = (field: string) => `compare-${side}-${field}`;
  const label = 'block mb-1 text-xs font-medium text-muted';

  return (
    <div className="border border-line rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <SidePill side={side} />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id('workload')} className={label}>Workload</label>
          <select
            id={id('workload')}
            value={config.workload}
            onChange={(e) => onChange({ ...config, workload: e.target.value })}
            className={INPUT}
          >
            <option value="mixed">mixed</option>
            <option value="cpu_heavy">cpu_heavy</option>
            <option value="io_heavy">io_heavy</option>
            <option value="memory_hog">memory_hog</option>
          </select>
        </div>
        <div>
          <label htmlFor={id('scheduler')} className={label}>Scheduler</label>
          <select
            id={id('scheduler')}
            value={config.scheduler}
            onChange={(e) => onChange({ ...config, scheduler: e.target.value })}
            className={INPUT}
          >
            <option value="rr">Round Robin</option>
            <option value="fcfs">FCFS</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        <div>
          <label htmlFor={id('ram')} className={label}>RAM (frames)</label>
          <input
            id={id('ram')}
            type="number" min="4" max="64" step="4"
            value={config.ram_frames}
            onChange={(e) => onChange({ ...config, ram_frames: parseInt(e.target.value) || ramFallback })}
            className={`${INPUT} tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor={id('quantum')} className={label}>Quantum (ticks)</label>
          <input
            id={id('quantum')}
            type="number" min="1" max="16"
            value={config.quantum}
            onChange={(e) => onChange({ ...config, quantum: parseInt(e.target.value) || 4 })}
            className={`${INPUT} tabular-nums`}
          />
        </div>
      </div>
    </div>
  );
}

function deltaTone(better: boolean | null) {
  if (better === true) return 'bg-primary-soft text-primary-ink';
  if (better === false) return 'bg-danger-soft text-danger';
  return 'text-muted';
}

export default function WhatIfCompare({ isOpen, onClose }: Readonly<WhatIfCompareProps>) {
  useDismiss(isOpen, onClose);
  const { config: initialConfig } = useSimStore();

  const [configA, setConfigA] = useState<SimConfig>({ ...initialConfig });
  const [configB, setConfigB] = useState<SimConfig>({
    ...initialConfig,
    ram_frames: Math.min(64, initialConfig.ram_frames * 2)
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await compareSimulations(configA, configB);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'เกิดข้อผิดพลาดในการเปรียบเทียบ');
    }
    setLoading(false);
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'ram') {
      setConfigA({ ...initialConfig, workload: 'memory_hog', ram_frames: 8 });
      setConfigB({ ...initialConfig, workload: 'memory_hog', ram_frames: 24 });
    } else if (presetName === 'quantum') {
      setConfigA({ ...initialConfig, workload: 'cpu_heavy', scheduler: 'rr', quantum: 1 });
      setConfigB({ ...initialConfig, workload: 'cpu_heavy', scheduler: 'rr', quantum: 8 });
    } else if (presetName === 'algo') {
      setConfigA({ ...initialConfig, workload: 'mixed', replacement: 'fifo' });
      setConfigB({ ...initialConfig, workload: 'mixed', replacement: 'lru' });
    }
  };

  const metricNameThai: Record<string, string> = {
    avg_turnaround: 'เวลารวมเฉลี่ย (Turnaround)',
    avg_waiting: 'เวลารอคิวเฉลี่ย (Wait Time)',
    avg_response: 'เวลาตอบสนองเฉลี่ย (Response)',
    throughput: 'ปริมาณงานสำเร็จ (Throughput)',
    total_page_faults: 'ยอด Page Fault รวม',
    page_fault_rate: 'อัตราเกิด Page Fault',
    cpu_util: 'การใช้งาน CPU',
    ram_util: 'การใช้งาน RAM',
    disk_util: 'การใช้งาน Disk I/O',
    fairness: 'ดัชนีความเป็นธรรม (Jain Index)',
    context_switches: 'จำนวนการสลับงาน (Context Switch)',
    thrashing_fraction: 'สัดส่วนเวลาเกิด Thrashing',
  };

  const quickPresets = [
    { id: 'ram', label: '1. เพิ่ม RAM แก้ Thrashing (8 vs 24 ช่อง)' },
    { id: 'quantum', label: '2. ผลของ Quantum (Q=1 vs Q=8)' },
    { id: 'algo', label: '3. อัลกอริทึมแรม (FIFO vs LRU)' },
  ];

  const highlights = result
    ? [
        { key: 'total_page_faults', label: 'ยอด Page Fault รวม', digits: 0 },
        { key: 'avg_turnaround', label: 'เวลารวมเฉลี่ย (Turnaround)', digits: 1 },
        { key: 'throughput', label: 'งานสำเร็จต่อเวลา (Throughput)', digits: 3 },
      ].flatMap(({ key, label, digits }) => {
        const item = result.delta_metrics[key];
        return item ? [{ key, label, digits, item }] : [];
      })
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="compare-overlay"
          onPointerDown={backdropDismiss(onClose)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-modal-title"
            className="bg-surface border border-line rounded-xl shadow-pop w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
              <div>
                <h2 id="compare-modal-title" className="text-lg font-semibold text-ink">
                  เปรียบเทียบ A/B
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  จำลอง 2 การตั้งค่าเคียงข้างกัน เพื่อวัดผลของการปรับแต่งระบบ
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="ปิด"
                className="shrink-0 text-muted hover:text-ink hover:bg-surface-muted rounded-md p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5 text-sm text-ink">
              {/* Quick presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted mr-1">ชุดทดลองด่วน</span>
                {quickPresets.map((p) => (
                  <button key={p.id} onClick={() => applyPreset(p.id)} className={SECONDARY_BUTTON}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Config A / B side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigCard
                  side="A"
                  title="ระบบ A"
                  subtitle="ก่อนปรับแก้ (Baseline)"
                  config={configA}
                  onChange={setConfigA}
                  ramFallback={8}
                />
                <ConfigCard
                  side="B"
                  title="ระบบ B"
                  subtitle="หลังปรับแก้ (Optimized)"
                  config={configB}
                  onChange={setConfigB}
                  ramFallback={16}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunCompare}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-hover rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={15} />
                      <span>กำลังจำลองทั้งสองระบบ...</span>
                    </>
                  ) : (
                    <>
                      <GitCompare size={15} />
                      <span>คำนวณเปรียบเทียบผลลัพธ์</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="border-l-[3px] border-danger bg-danger-soft rounded-r-lg px-3.5 py-2.5 text-sm text-danger"
                >
                  {error}
                </div>
              )}

              {/* Comparison results */}
              {result && (
                <section className="space-y-4 pt-5 border-t border-line">
                  <h3 className="text-base font-semibold text-ink">ผลต่างระหว่าง A และ B</h3>

                  {/* Highlight cards */}
                  {highlights.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {highlights.map(({ key, label, digits, item }) => (
                        <div key={key} className="border border-line rounded-lg p-3.5">
                          <span className="block text-xs font-medium text-muted">{label}</span>
                          <div className="flex items-baseline justify-between gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                              <span className="text-muted">{digits === 0 ? item.a : item.a.toFixed(digits)}</span>
                              <ArrowRight size={12} className="text-subtle self-center" />
                              <span className="font-semibold text-ink">{digits === 0 ? item.b : item.b.toFixed(digits)}</span>
                            </span>
                            {item.pct !== null && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${
                                  item.better ? 'bg-primary-soft text-primary-ink' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                {`${item.pct.toFixed(1)}%`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed metrics table */}
                  <div className="overflow-x-auto border border-line rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-muted text-muted text-xs font-medium">
                        <tr className="border-b border-line">
                          <th className="py-2 px-3 font-medium">ตัวชี้วัด</th>
                          <th className="py-2 px-3 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <SidePill side="A" />
                              ระบบ A
                            </span>
                          </th>
                          <th className="py-2 px-3 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <SidePill side="B" />
                              ระบบ B
                            </span>
                          </th>
                          <th className="py-2 px-3 font-medium">ผลต่าง</th>
                          <th className="py-2 px-3 font-medium">% เปลี่ยนแปลง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.delta_metrics).map(([key, item]) => {
                          const isPct = key.includes('util') || key.includes('rate') || key.includes('fraction');
                          const formatVal = (v: number) => isPct ? `${(v * 100).toFixed(1)}%` : v.toFixed(2);

                          let TrendIcon = Minus;
                          if (item.better === true) TrendIcon = TrendingUp;
                          else if (item.better === false) TrendIcon = TrendingDown;

                          return (
                            <tr key={key} className="border-b border-line last:border-b-0 hover:bg-surface-muted/60 transition-colors">
                              <td className="py-2 px-3 text-ink">
                                {metricNameThai[key] || key}
                              </td>
                              <td className="py-2 px-3 tabular-nums text-ink">
                                {formatVal(item.a)}
                              </td>
                              <td className="py-2 px-3 tabular-nums font-semibold text-ink">
                                {formatVal(item.b)}
                              </td>
                              <td className="py-2 px-3 tabular-nums text-muted">
                                {item.delta > 0 ? `+${formatVal(item.delta)}` : formatVal(item.delta)}
                              </td>
                              <td className="py-2 px-3">
                                {item.pct !== null ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${deltaTone(item.better)}`}
                                  >
                                    <TrendIcon size={13} />
                                    {item.pct > 0 ? `+${item.pct.toFixed(1)}%` : `${item.pct.toFixed(1)}%`}
                                  </span>
                                ) : (
                                  <span className="text-subtle">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-3.5 border-t border-line">
              <button onClick={onClose} className={SECONDARY_BUTTON}>
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
