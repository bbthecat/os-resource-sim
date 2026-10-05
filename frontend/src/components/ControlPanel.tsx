import { useEffect, useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { runSimulation, fetchWorkloads } from '../api/client';
import { Play, Sliders, RefreshCw } from 'lucide-react';
import { AnimatedSlider } from './AnimatedSlider';

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
    <div className="bg-white p-4 rounded-lg shadow-card border border-border-subtle space-y-4">
      <div className="flex items-center space-x-2 text-slate-700 border-b border-border-subtle pb-2.5">
        <Sliders className="text-blue-500" size={17} />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-800">พารามิเตอร์จำลอง</h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">SIMULATION CONFIG</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-md bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3.5 text-xs">
        {/* Workload */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 tracking-wide">
            รูปแบบงาน <span className="text-slate-400 font-normal">(Workload)</span>
          </label>
          <select 
            value={config.workload}
            onChange={(e) => setConfig({ ...config, workload: e.target.value })}
            className="w-full bg-slate-50 border border-border-subtle hover:border-pastel-blue rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:border-blue-500 focus:outline-none transition shadow-inner font-semibold"
          >
            {workloads.length > 0 ? (
              workloads.map(w => <option key={w} value={w}>{getWorkloadLabel(w)}</option>)
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
        </div>

        {/* Scheduler */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 tracking-wide">
            อัลกอริทึมจัดคิว <span className="text-slate-400 font-normal">(CPU Scheduler)</span>
          </label>
          <select 
            value={config.scheduler}
            onChange={(e) => setConfig({ ...config, scheduler: e.target.value })}
            className="w-full bg-slate-50 border border-border-subtle hover:border-pastel-blue rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:border-blue-500 focus:outline-none transition shadow-inner font-semibold"
          >
            <option value="rr">Round Robin (สลับคิววนรอบ)</option>
            <option value="fcfs">FCFS (มาก่อนได้ก่อน)</option>
            <option value="priority">Priority (ตามความสำคัญ)</option>
            <option value="sjf">SJF (งานสั้นทำก่อน)</option>
          </select>
        </div>

        {/* Quantum (Only when RR) */}
        {config.scheduler === 'rr' && (
          <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-subtle relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/20 to-transparent"></div>
             <div className="relative z-10">
                <AnimatedSlider
                  value={config.quantum}
                  onValueChange={(val) => setConfig({ ...config, quantum: val })}
                  min={1}
                  max={16}
                  color="blue"
                  label="Time Quantum"
                  unit="ticks"
                />
             </div>
          </div>
        )}

        {/* RAM Frames */}
        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-subtle relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pastel-green/30 to-transparent"></div>
          <div className="relative z-10">
            <AnimatedSlider
              value={config.ram_frames}
              onValueChange={(val) => setConfig({ ...config, ram_frames: val })}
              min={4}
              max={64}
              step={4}
              color="emerald"
              label="RAM Size"
              unit="frames"
            />
          </div>
        </div>

        {/* Page Replacement */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 tracking-wide">
            อัลกอริทึมจัดการหน้า <span className="text-slate-400 font-normal">(Page Replacement)</span>
          </label>
          <select 
            value={config.replacement}
            onChange={(e) => setConfig({ ...config, replacement: e.target.value })}
            className="w-full bg-slate-50 border border-border-subtle hover:border-pastel-blue rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:border-blue-500 focus:outline-none transition shadow-inner font-semibold"
          >
            <option value="lru">LRU (Least Recently Used)</option>
            <option value="fifo">FIFO (First-In, First-Out)</option>
            <option value="clock">Clock / Second Chance</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleSimulate}
        disabled={loading}
        className="w-full mt-2 bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-blue-300 hover:to-purple-300 active:scale-95 text-slate-800 font-bold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 text-xs transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/40"
      >
        {loading ? (
          <>
            <RefreshCw className="animate-spin" size={15} />
            <span>กำลังรันการจำลอง...</span>
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            <span>เริ่มการจำลอง (Run Simulation)</span>
          </>
        )}
      </button>
    </div>
  );
}
