import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimStore } from '../store/useSimStore';
import { runSimulation } from '../api/client';
import { X, Play, RefreshCw, Dice5 } from 'lucide-react';

interface CustomWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INPUT =
  'w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-sm text-ink tabular-nums hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors';

const LABEL = 'text-sm font-medium text-ink';
const HINT = 'ml-1 text-xs font-normal text-muted';
const VALUE_BADGE = 'shrink-0 bg-surface-muted text-ink text-sm font-medium tabular-nums px-2 py-0.5 rounded-md';

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors';

export default function CustomWorkloadModal({ isOpen, onClose }: Readonly<CustomWorkloadModalProps>) {
  const { config, setConfig, setResult } = useSimStore();
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [loading, setLoading] = useState(false);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="custom-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-modal-title"
            className="bg-surface border border-line rounded-xl shadow-pop w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
              <div>
                <h2 id="custom-modal-title" className="text-lg font-semibold text-ink">
                  ตั้งค่าขั้นสูง
                </h2>
                <p className="mt-0.5 text-sm text-muted">กำหนด seed สำหรับสุ่มงาน ความเร็วดิสก์ และกลไก aging</p>
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
              {/* Seed */}
              <div>
                <div className="flex justify-between items-center gap-3 mb-1.5">
                  <label htmlFor="custom-seed" className={LABEL}>
                    Random seed
                  </label>
                  <button
                    onClick={handleRandomSeed}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover rounded-md px-1.5 py-0.5 hover:bg-primary-soft/60 transition-colors"
                  >
                    <Dice5 size={14} />
                    สุ่มใหม่
                  </button>
                </div>
                <input
                  id="custom-seed"
                  type="number"
                  value={localConfig.seed}
                  onChange={(e) => setLocalConfig({ ...localConfig, seed: parseInt(e.target.value) || 1 })}
                  className={INPUT}
                />
                <p className="mt-1.5 text-xs text-muted">ใช้ seed เดิมจะได้ผลการจำลองเหมือนเดิมทุกครั้ง</p>
              </div>

              {/* Disk service time */}
              <div>
                <div className="flex justify-between items-center gap-3 mb-2">
                  <label htmlFor="custom-disk" className={LABEL}>
                    เวลาอ่านเขียนดิสก์
                    <span className={HINT}>Disk service time</span>
                  </label>
                  <span className={VALUE_BADGE}>{localConfig.disk_service_time} ticks</span>
                </div>
                <input
                  id="custom-disk"
                  type="range"
                  min="1"
                  max="20"
                  value={localConfig.disk_service_time}
                  onChange={(e) => setLocalConfig({ ...localConfig, disk_service_time: parseInt(e.target.value) })}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-muted">
                  <span>1 tick (NVMe SSD เร็ว)</span>
                  <span>20 ticks (HDD จานหมุน ช้า)</span>
                </div>
              </div>

              {/* Aging interval */}
              <div>
                <div className="flex justify-between items-center gap-3 mb-2">
                  <label htmlFor="custom-aging" className={LABEL}>
                    กลไกป้องกันงานอดตาย
                    <span className={HINT}>Aging interval</span>
                  </label>
                  <span className={VALUE_BADGE}>
                    {localConfig.aging_interval === 0 ? 'ปิดใช้งาน' : `${localConfig.aging_interval} ticks`}
                  </span>
                </div>
                <input
                  id="custom-aging"
                  type="range"
                  min="0"
                  max="20"
                  step="2"
                  value={localConfig.aging_interval}
                  onChange={(e) => setLocalConfig({ ...localConfig, aging_interval: parseInt(e.target.value) })}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted">
                  สำหรับ Priority scheduler: เพิ่มลำดับความสำคัญเมื่อรอนาน เพื่อป้องกัน starvation
                </p>
              </div>

              {/* Max ticks */}
              <div>
                <label htmlFor="custom-max-ticks" className={`block mb-1.5 ${LABEL}`}>
                  เวลาจำลองสูงสุด
                  <span className={HINT}>Max ticks</span>
                </label>
                <input
                  id="custom-max-ticks"
                  type="number"
                  min="100"
                  max="5000"
                  step="100"
                  value={localConfig.max_ticks}
                  onChange={(e) => setLocalConfig({ ...localConfig, max_ticks: parseInt(e.target.value) || 2000 })}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-2 px-5 py-3.5 border-t border-line">
              <button onClick={onClose} className={SECONDARY_BUTTON}>
                ยกเลิก
              </button>
              <button
                onClick={handleApplyAndRun}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-hover rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>กำลังจำลอง...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Apply & run</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
