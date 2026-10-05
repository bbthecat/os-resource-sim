import { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { compareSimulations, CompareResult } from '../api/client';
import { SimConfig } from '../types/sim';
import { GitCompare, TrendingUp, TrendingDown, Minus, RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhatIfCompareProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatIfCompare({ isOpen, onClose }: WhatIfCompareProps) {
  const { config: initialConfig } = useSimStore();
  
  const [configA, setConfigA] = useState<SimConfig>({ ...initialConfig });
  const [configB, setConfigB] = useState<SimConfig>({ 
    ...initialConfig, 
    ram_frames: Math.min(64, initialConfig.ram_frames * 2) 
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 border border-white/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pastel-purple/20 via-white to-pastel-blue/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-600 shadow-sm">
              <GitCompare size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-800">
                  การทดลองเปรียบเทียบ A/B (What-If Comparison)
                </h2>
                <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                  BENCHMARK
                </span>
              </div>
              <p className="text-xs text-slate-500">
                จำลองเปรียบเทียบ 2 การตั้งค่าเคียงข้างกันเพื่อวัดผลสัมฤทธิ์ของการปรับแต่งระบบ
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed flex-grow">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-pastel-yellow/30 to-amber-50/50 p-3.5 rounded-xl border border-amber-200/60">
            <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5 mr-1">
              <Sparkles size={15} className="text-amber-500" />
              ชุดทดลองด่วน:
            </span>
            <button
              onClick={() => applyPreset('ram')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 hover:text-slate-900 text-xs font-medium border border-amber-200 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              1. เพิ่ม RAM แก้ Thrashing (8 vs 24 ช่อง)
            </button>
            <button
              onClick={() => applyPreset('quantum')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 hover:text-slate-900 text-xs font-medium border border-amber-200 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              2. ผลของ Quantum (Q=1 vs Q=8)
            </button>
            <button
              onClick={() => applyPreset('algo')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 hover:text-slate-900 text-xs font-medium border border-amber-200 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              3. อัลกอริทึมแรม (FIFO vs LRU)
            </button>
          </div>

          {/* Config Panels Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Config A */}
            <div className="bg-white border-2 border-indigo-200/80 p-4 sm:p-5 rounded-2xl shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                <span className="font-bold text-indigo-700 text-sm">ระบบ A (ก่อนปรับแก้ / Baseline)</span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 font-bold">Config A</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Workload</label>
                  <select 
                    value={configA.workload}
                    onChange={(e) => setConfigA({ ...configA, workload: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-medium"
                  >
                    <option value="mixed">mixed</option>
                    <option value="cpu_heavy">cpu_heavy</option>
                    <option value="io_heavy">io_heavy</option>
                    <option value="memory_hog">memory_hog</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Scheduler</label>
                  <select 
                    value={configA.scheduler}
                    onChange={(e) => setConfigA({ ...configA, scheduler: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-medium"
                  >
                    <option value="rr">Round Robin</option>
                    <option value="fcfs">FCFS</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">RAM (Frames)</label>
                  <input 
                    type="number" min="4" max="64" step="4"
                    value={configA.ram_frames}
                    onChange={(e) => setConfigA({ ...configA, ram_frames: parseInt(e.target.value) || 8 })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantum (ticks)</label>
                  <input 
                    type="number" min="1" max="16"
                    value={configA.quantum}
                    onChange={(e) => setConfigA({ ...configA, quantum: parseInt(e.target.value) || 4 })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Config B */}
            <div className="bg-white border-2 border-emerald-200/80 p-4 sm:p-5 rounded-2xl shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                <span className="font-bold text-emerald-700 text-sm">ระบบ B (หลังปรับแก้ / Optimized)</span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 font-bold">Config B</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Workload</label>
                  <select 
                    value={configB.workload}
                    onChange={(e) => setConfigB({ ...configB, workload: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-medium"
                  >
                    <option value="mixed">mixed</option>
                    <option value="cpu_heavy">cpu_heavy</option>
                    <option value="io_heavy">io_heavy</option>
                    <option value="memory_hog">memory_hog</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Scheduler</label>
                  <select 
                    value={configB.scheduler}
                    onChange={(e) => setConfigB({ ...configB, scheduler: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-medium"
                  >
                    <option value="rr">Round Robin</option>
                    <option value="fcfs">FCFS</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">RAM (Frames)</label>
                  <input 
                    type="number" min="4" max="64" step="4"
                    value={configB.ram_frames}
                    onChange={(e) => setConfigB({ ...configB, ram_frames: parseInt(e.target.value) || 16 })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantum (ticks)</label>
                  <input 
                    type="number" min="1" max="16"
                    value={configB.quantum}
                    onChange={(e) => setConfigB({ ...configB, quantum: parseInt(e.target.value) || 4 })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs transition outline-none shadow-inner font-mono font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Run Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRunCompare}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-pastel-blue via-indigo-400 to-pastel-purple hover:from-blue-400 hover:to-purple-500 text-slate-900 font-bold text-xs rounded-xl shadow-glow border border-white/60 flex items-center space-x-2 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  <span>กำลังคำนวณ Benchmark ทั้งสองระบบ...</span>
                </>
              ) : (
                <>
                  <GitCompare size={15} />
                  <span>คำนวณเปรียบเทียบผลลัพธ์ (Run Benchmark)</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Comparison Results */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                ผลการประเมินความแตกต่าง (Comparison Delta)
              </h3>

              {/* Top Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Page Faults Delta */}
                {result.delta_metrics.total_page_faults && (
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                    <span className="text-[11px] text-slate-500 font-medium block">ยอด Page Fault รวม</span>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="font-mono text-sm text-slate-600">
                        {result.delta_metrics.total_page_faults.a} ➔ <strong className="text-slate-900 font-bold">{result.delta_metrics.total_page_faults.b}</strong>
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                        result.delta_metrics.total_page_faults.better 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {result.delta_metrics.total_page_faults.pct !== null && `${result.delta_metrics.total_page_faults.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Turnaround Time Delta */}
                {result.delta_metrics.avg_turnaround && (
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                    <span className="text-[11px] text-slate-500 font-medium block">เวลารวมเฉลี่ย (Turnaround)</span>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="font-mono text-sm text-slate-600">
                        {result.delta_metrics.avg_turnaround.a.toFixed(1)} ➔ <strong className="text-slate-900 font-bold">{result.delta_metrics.avg_turnaround.b.toFixed(1)}</strong>
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                        result.delta_metrics.avg_turnaround.better 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {result.delta_metrics.avg_turnaround.pct !== null && `${result.delta_metrics.avg_turnaround.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Throughput Delta */}
                {result.delta_metrics.throughput && (
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                    <span className="text-[11px] text-slate-500 font-medium block">งานสำเร็จต่อเวลา (Throughput)</span>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="font-mono text-sm text-slate-600">
                        {result.delta_metrics.throughput.a.toFixed(3)} ➔ <strong className="text-slate-900 font-bold">{result.delta_metrics.throughput.b.toFixed(3)}</strong>
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                        result.delta_metrics.throughput.better 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {result.delta_metrics.throughput.pct !== null && `${result.delta_metrics.throughput.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Metrics Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">ตัวชี้วัด (Metric)</th>
                      <th className="py-2.5 px-3 text-indigo-700 font-bold">ระบบ A</th>
                      <th className="py-2.5 px-3 text-emerald-700 font-bold">ระบบ B</th>
                      <th className="py-2.5 px-3 text-slate-700">ผลต่าง (Delta)</th>
                      <th className="py-2.5 px-3 text-slate-700">% เปลี่ยนแปลง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(result.delta_metrics).map(([key, item]) => {
                      const isPct = key.includes('util') || key.includes('rate') || key.includes('fraction');
                      const formatVal = (v: number) => isPct ? `${(v * 100).toFixed(1)}%` : v.toFixed(2);

                      return (
                        <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {metricNameThai[key] || key}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-600 font-semibold">
                            {formatVal(item.a)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                            {formatVal(item.b)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {item.delta > 0 ? `+${formatVal(item.delta)}` : formatVal(item.delta)}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.pct !== null ? (
                              <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs ${
                                item.better === true ? 'bg-emerald-50 text-emerald-700' : item.better === false ? 'bg-rose-50 text-rose-700' : 'text-slate-500'
                              }`}>
                                {item.better === true ? <TrendingUp size={14} /> : item.better === false ? <TrendingDown size={14} /> : <Minus size={14} />}
                                {item.pct > 0 ? `+${item.pct.toFixed(1)}%` : `${item.pct.toFixed(1)}%`}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
