import { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { runSimulation } from '../api/client';
import { Settings2, X, Play, RefreshCw, Dice5 } from 'lucide-react';

interface CustomWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomWorkloadModal({ isOpen, onClose }: CustomWorkloadModalProps) {
  const { config, setConfig, setResult } = useSimStore();
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRandomSeed = () => {
    setLocalConfig(prev => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000) + 1,
    }));
  };

  const handleApplyAndRun = async () => {
    setLoading(true);
    try {
      setConfig(localConfig);
      const res = await runSimulation(localConfig);
      setResult(res);
      onClose();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 border border-white/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pastel-purple/20 via-white to-pastel-blue/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-600 shadow-sm">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">ปรับแต่งพารามิเตอร์ขั้นสูง (Advanced Settings)</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">กำหนดค่า Seed สุ่มงาน, ความเร็วดิสก์ และกลไก Aging</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          {/* Seed */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 text-xs">
                Random Seed:
              </label>
              <button
                onClick={handleRandomSeed}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-bold text-xs hover:underline"
              >
                <Dice5 size={14} />
                <span>Re-roll Seed</span>
              </button>
            </div>
            <input
              type="number"
              value={localConfig.seed}
              onChange={(e) => setLocalConfig({ ...localConfig, seed: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs font-bold focus:bg-white focus:border-blue-400 focus:outline-none transition shadow-inner"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              การใช้ Seed เดิมจะได้ผลการจำลองซ้ำเหมือนเดิม 100% (Deterministic Replication)
            </p>
          </div>

          {/* Disk Service Time */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-amber-900 text-xs">
                เวลาอ่านเขียนดิสก์ (Disk Service Time):
              </label>
              <span className="font-mono text-amber-700 font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-200">
                {localConfig.disk_service_time} ticks
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={localConfig.disk_service_time}
              onChange={(e) => setLocalConfig({ ...localConfig, disk_service_time: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-200/70 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>1 tick (Fast NVMe SSD)</span>
              <span>20 ticks (Slow Mechanical HDD)</span>
            </div>
          </div>

          {/* Aging Interval */}
          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/70 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-blue-900 text-xs">
                กลไกป้องกันงานอดตาย (Aging Interval):
              </label>
              <span className="font-mono text-blue-700 font-bold text-sm bg-white px-2 py-0.5 rounded border border-blue-200">
                {localConfig.aging_interval === 0 ? 'Disabled' : `${localConfig.aging_interval} ticks`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="2"
              value={localConfig.aging_interval}
              onChange={(e) => setLocalConfig({ ...localConfig, aging_interval: parseInt(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-blue-200/70 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              สำหรับ Priority Scheduler: เพิ่มลำดับความสำคัญเมื่อรอนานเพื่อป้องกัน Starvation
            </p>
          </div>

          {/* Max Ticks */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              ขีดจำกัดเวลาจำลองสูงสุด (Max Ticks Limit):
            </label>
            <input
              type="number"
              min="100"
              max="5000"
              step="100"
              value={localConfig.max_ticks}
              onChange={(e) => setLocalConfig({ ...localConfig, max_ticks: parseInt(e.target.value) || 2000 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs font-bold focus:bg-white focus:border-blue-400 focus:outline-none transition shadow-inner"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center">
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAndRun}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-blue-300 hover:to-purple-300 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>กำลังจำลอง...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Apply & Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
