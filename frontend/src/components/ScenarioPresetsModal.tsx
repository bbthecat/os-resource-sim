import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismiss, backdropDismiss } from '../hooks/useDismiss';
import { useSimStore } from '../store/useSimStore';
import { runSimulation } from '../api/client';
import { SimConfig } from '../types/sim';
import { X, Play, RefreshCw, AlertTriangle, Cpu, HardDrive, Layers, CheckCircle2 } from 'lucide-react';

// Category tags are neutral: the cards don't get per-scenario color themes
const TAG_NEUTRAL = 'bg-surface-muted text-muted';

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
    badgeColor: TAG_NEUTRAL,
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
    badgeColor: TAG_NEUTRAL,
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
    badgeColor: TAG_NEUTRAL,
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
    badgeColor: TAG_NEUTRAL,
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
    badgeColor: TAG_NEUTRAL,
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

export default function ScenarioPresetsModal({ isOpen, onClose, onSelectPreset }: Readonly<ScenarioPresetsModalProps>) {
  useDismiss(isOpen, onClose);
  const { config, setConfig, setResult } = useSimStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="presets-overlay"
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
            aria-labelledby="presets-modal-title"
            className="bg-surface border border-line rounded-xl shadow-pop w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
              <div>
                <h2 id="presets-modal-title" className="text-lg font-semibold text-ink">
                  สถานการณ์จำลองมาตรฐาน
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  เลือกสถานการณ์เพื่อทดลองและสังเกตพฤติกรรมสำคัญของเคอร์เนล ระบบจะตั้งค่าและรันการจำลองให้ทันที
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

            {/* Presets list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isLoading = loadingId === preset.id;

                return (
                  <section
                    key={preset.id}
                    className="border border-line rounded-lg p-4 hover:border-primary/50 hover:bg-primary-soft/40 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Icon size={18} className="text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-ink leading-snug">{preset.title}</h3>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${preset.badgeColor}`}>
                            {preset.badge}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyPreset(preset)}
                        disabled={isLoading || loadingId !== null}
                        className="shrink-0 self-start inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary-hover rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

                    <p className="text-sm text-muted leading-relaxed">{preset.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-sm">
                      <div>
                        <p className="font-medium text-warning">สิ่งที่ควรสังเกต</p>
                        <p className="mt-0.5 text-ink leading-relaxed">{preset.observation}</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">บทเรียน</p>
                        <p className="mt-0.5 text-ink leading-relaxed">{preset.lesson}</p>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-line text-xs text-muted">
                      <span className="bg-surface-muted px-2.5 py-0.5 rounded-full">
                        Workload <span className="font-mono text-ink">{preset.config.workload}</span>
                      </span>
                      <span className="bg-surface-muted px-2.5 py-0.5 rounded-full">
                        Scheduler <span className="font-mono text-ink">{preset.config.scheduler}</span>
                      </span>
                      <span className="bg-surface-muted px-2.5 py-0.5 rounded-full">
                        RAM <span className="text-ink tabular-nums">{preset.config.ram_frames} frames</span>
                      </span>
                      <span className="bg-surface-muted px-2.5 py-0.5 rounded-full">
                        Policy <span className="font-mono text-ink">{preset.config.replacement}</span>
                      </span>
                    </div>
                  </section>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
