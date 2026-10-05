import { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { runSimulation } from '../api/client';
import { SimConfig } from '../types/sim';
import { X, Play, RefreshCw, AlertTriangle, Cpu, HardDrive, Layers, CheckCircle2 } from 'lucide-react';

interface ScenarioPreset {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: typeof AlertTriangle;
  description: string;
  observation: string;
  lesson: string;
  config: Partial<SimConfig>;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'thrashing',
    title: '1. หายนะ Thrashing (Thrashing Disaster)',
    badge: 'Virtual Memory / Paging',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    icon: AlertTriangle,
    description: 'จำลองกรณี RAM ไม่พอสำหรับ Working Set ของโปรเซส ทำให้เกิด Page Fault ถล่มทลาย',
    observation: 'CPU Utilization ดิ่งลงต่ำ ทั้งๆ ที่ระบบอืด เพราะ Disk ติดคอขวด 100% จากการสลับหน้า (Swap)',
    lesson: 'ระบบปฏิบัติการที่เกิด Thrashing ไม่ได้ช้าเพราะ CPU ไม่พอ แต่เพราะเสียเวลาทำ I/O Paging ตลอดเวลา การเพิ่ม RAM หรือลด Degree of Multiprogramming จะแก้ปัญหาได้ทันที',
    config: {
      workload: 'memory_hog',
      scheduler: 'rr',
      quantum: 4,
      ram_frames: 4,
      replacement: 'fifo',
      disk_service_time: 5,
    },
  },
  {
    id: 'convoy',
    title: '2. ปรากฏการณ์ Convoy Effect (รถช้าขวางทาง)',
    badge: 'CPU Scheduling / FCFS',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Cpu,
    description: 'จำลองการใช้ FCFS เมื่อมีโปรเซสคำนวณยาวนาน (CPU-bound) วิ่งเข้ามาก่อนโปรเซสสั้นๆ',
    observation: 'Ready Queue ยาวสะสม โปรเซสสั้นๆ ต้องรอคอยอย่างไม่สมเหตุสมผล ทำให้ Average Waiting Time พุ่งสูง',
    lesson: 'FCFS เรียบง่ายแต่ก่อให้เกิด Convoy Effect แก้ได้ด้วย Round Robin (แบ่ง Time Quantum) หรือ Shortest Job First (SJF)',
    config: {
      workload: 'cpu_heavy',
      scheduler: 'fcfs',
      quantum: 4,
      ram_frames: 16,
      replacement: 'lru',
      disk_service_time: 3,
    },
  },
  {
    id: 'sjf_optimal',
    title: '3. SJF แก้ปัญหาคิวยาว (Shortest Job First)',
    badge: 'CPU Scheduling / Optimal Waiting',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    description: 'เปรียบเทียบกับ FCFS โดยนำโปรเซสงานสั้นขึ้นมาประมวลผลก่อน',
    observation: 'Average Waiting Time และ Turnaround Time ลดลงอย่างเห็นได้ชัดเมื่อเทียบกับ FCFS',
    lesson: 'SJF ได้รับการพิสูจน์ทางคณิตศาสตร์ว่าให้ Average Waiting Time ต่ำที่สุดสำหรับเซ็ตของโปรเซสที่กำหนด',
    config: {
      workload: 'cpu_heavy',
      scheduler: 'sjf',
      quantum: 4,
      ram_frames: 16,
      replacement: 'lru',
      disk_service_time: 3,
    },
  },
  {
    id: 'belady',
    title: "4. ปริศนา Belady's Anomaly (เพิ่ม RAM แต่ Fault เพิ่ม)",
    badge: 'Paging Anomaly / FIFO',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    icon: Layers,
    description: 'ทดสอบทฤษฎี Belady ใน FIFO เมื่อเพิ่ม Frame ของ RAM กลับทำให้เกิด Page Fault มากขึ้น',
    observation: 'ตรวจดูอัตรา Page Fault และเปรียบเทียบระหว่าง FIFO กับ Stack Algorithm เช่น LRU',
    lesson: "FIFO ไม่ใช่ Stack Algorithm ทำให้หน้าเพจที่อยู่ใน Frame เล็กอาจไม่ถูกเก็บไว้ใน Frame ที่ใหญ่กว่า ส่งผลให้เกิด Anomaly ในทางตรงกันข้าม LRU จะไม่มีปัญหานี้เด็ดขาด",
    config: {
      workload: 'textbook_examples',
      scheduler: 'fcfs',
      quantum: 4,
      ram_frames: 4,
      replacement: 'fifo',
      disk_service_time: 4,
    },
  },
  {
    id: 'clock_efficient',
    title: '5. Clock / Second Chance Algorithm (ประสิทธิภาพสูง)',
    badge: 'Memory / Approximate LRU',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    icon: HardDrive,
    description: 'จำลองอัลกอริทึมเข็มนาฬิกาที่ OS จริงส่วนใหญ่ (เช่น Linux) นิยมใช้เลียนแบบ LRU ด้วยต้นทุนต่ำ',
    observation: 'การทำงานของ Reference bit (0 และ 1) ที่ให้โอกาสที่สองแก่หน้าเพจที่เพิ่งถูกเรียกใช้',
    lesson: 'Clock Algorithm ให้ประสิทธิภาพใกล้เคียง LRU แท้จริงแต่ไม่ต้องใช้ฮาร์ดแวร์จัดเก็บ timestamp ที่ซับซ้อน',
    config: {
      workload: 'mixed',
      scheduler: 'rr',
      quantum: 4,
      ram_frames: 12,
      replacement: 'clock',
      disk_service_time: 4,
    },
  },
];

interface ScenarioPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset?: (preset: ScenarioPreset) => void;
}

export default function ScenarioPresetsModal({ isOpen, onClose, onSelectPreset }: ScenarioPresetsModalProps) {
  const { config, setConfig, setResult } = useSimStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = async (preset: ScenarioPreset) => {
    setLoadingId(preset.id);
    const newConfig: SimConfig = {
      ...config,
      ...preset.config,
    };
    try {
      setConfig(newConfig);
      const res = await runSimulation(newConfig);
      setResult(res);
      if (onSelectPreset) {
        onSelectPreset(preset);
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 border border-white/80 rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pastel-blue/20 via-white to-pastel-purple/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">สถานการณ์จำลองมาตรฐาน (Preset Scenarios)</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">เลือกสถานการณ์เพื่อทดลองและสังเกตพฤติกรรมสำคัญของเคอร์เนล</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets List */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] bg-slate-50/50">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isLoading = loadingId === preset.id;

            return (
              <div
                key={preset.id}
                className="bg-white border-2 border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-inner">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {preset.title}
                      </h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    disabled={isLoading || loadingId !== null}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>กำลังจำลอง...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span>จำลองสถานการณ์นี้</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {preset.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                    <span className="font-bold text-amber-800 block text-xs mb-1">ข้อสังเกตเชิงระบบ:</span>
                    <span className="text-slate-700 text-xs leading-relaxed">{preset.observation}</span>
                  </div>
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/70">
                    <span className="font-bold text-blue-800 block text-xs mb-1">หลักการระบบปฏิบัติการ:</span>
                    <span className="text-slate-700 text-xs leading-relaxed">{preset.lesson}</span>
                  </div>
                </div>

                {/* Parameters pill */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-100">
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">Workload: <strong>{preset.config.workload}</strong></span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">Scheduler: <strong>{preset.config.scheduler}</strong></span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">RAM: <strong>{preset.config.ram_frames} frames</strong></span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">Policy: <strong>{preset.config.replacement}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
