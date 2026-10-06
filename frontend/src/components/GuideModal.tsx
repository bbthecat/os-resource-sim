import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Stethoscope, ListOrdered, MemoryStick } from 'lucide-react';
import { useSimStore } from '../store/useSimStore';
import { CHART } from '../lib/colors';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'intro' | 'labs' | 'controls';

const TABS: { id: GuideTab; label: string }[] = [
  { id: 'intro', label: 'พื้นฐานที่ต้องรู้' },
  { id: 'labs', label: 'การทดลองแนะนำ 3 ข้อ' },
  { id: 'controls', label: 'วิธีอ่านหน้าจอ' },
];

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors';

export default function GuideModal({ isOpen, onClose }: Readonly<GuideModalProps>) {
  const [activeTab, setActiveTab] = useState<GuideTab>('intro');
  const { setConfig, config } = useSimStore();

  const loadScenario = (scenario: { workload: string; scheduler: string; quantum?: number; ram_frames?: number; replacement?: string }) => {
    setConfig({
      ...config,
      ...scenario,
      quantum: scenario.quantum ?? config.quantum,
      ram_frames: scenario.ram_frames ?? config.ram_frames,
      replacement: scenario.replacement ?? config.replacement,
    });
    onClose();
  };

  const resources = [
    {
      color: CHART.cpu,
      title: 'CPU (หน่วยประมวลผล)',
      body: (
        <>
          เปรียบเหมือน "พ่อครัว" ที่ทำอาหารได้ทีละจาน มีอัลกอริทึมเช่น <strong className="font-medium text-ink">Round Robin</strong> ช่วยสลับเวลาให้ทุกคนได้กินเรื่อยๆ
        </>
      ),
    },
    {
      color: CHART.ram,
      title: 'RAM (โต๊ะเตรียมอาหาร)',
      body: (
        <>
          โต๊ะมีขนาดจำกัด (เช่น 16 ช่อง Frame) ถ้าวัตถุดิบไม่อยู่บนโต๊ะ จะเกิด <strong className="font-medium text-ink">Page Fault</strong> ต้องเสียเวลาเดินไปหยิบจากตู้เย็น (Disk)
        </>
      ),
    },
    {
      color: CHART.disk,
      title: 'Disk I/O (ตู้เย็นเก็บของ)',
      body: (
        <>
          จุของได้มหาศาลแต่เปิดหยิบช้ามาก ถ้าพ่อครัวสั่งของจากตู้เย็นตลอดเวลา ครัวจะหยุดชะงักเรียกว่า <strong className="font-medium text-ink">Thrashing</strong>
        </>
      ),
    },
  ];

  const labs = [
    {
      title: 'Lab 1: ดูอาการคอมค้างเพราะแรมหมด (Thrashing)',
      action: 'ลองตั้งค่านี้',
      onApply: () => loadScenario({ workload: 'memory_hog', scheduler: 'rr', ram_frames: 8, quantum: 4 }),
      body: (
        <>
          แรมมีแค่ 8 ช่องแต่งานขอใช้เยอะ จะเกิดแถบแดงเตือน <em>Thrashing Alert</em> ดิสก์วิ่ง 100% แต่ CPU แทบจะว่างงาน (Idle) เพราะงานไปออรอในช่อง <em>Waiting Memory</em>
        </>
      ),
    },
    {
      title: 'Lab 2: สลับคิวแบบ Round Robin (Time Quantum สั้น vs ยาว)',
      action: 'ลองตั้งค่านี้ (Q=1)',
      onApply: () => loadScenario({ workload: 'cpu_heavy', scheduler: 'rr', quantum: 1, ram_frames: 32 }),
      body: (
        <>
          เมื่อ Quantum สั้นมาก (1 tick) งานจะโดนสลับคิว (Preempt) บ่อยมาก ทำให้เวลารอคอยเฉลี่ยลดลงแต่สลับบ่อย เปรียบเทียบกับตั้ง Quantum = 16 ticks
        </>
      ),
    },
    {
      title: 'Lab 3: การจัดการแรม LRU vs FIFO',
      action: 'ลองตั้งค่านี้',
      onApply: () => loadScenario({ workload: 'mixed', scheduler: 'rr', ram_frames: 16, replacement: 'lru' }),
      body: (
        <>
          ลองสลับระหว่าง <strong className="font-medium text-ink">LRU</strong> และ <strong className="font-medium text-ink">FIFO</strong> ดูว่าอัลกอริทึมไหนทำให้เกิดยอด <em>Page Fault สะสม</em> น้อยกว่ากัน
        </>
      ),
    },
  ];

  const cheatSheet = [
    {
      Icon: Play,
      title: 'ปุ่มเล่นและแถบไทม์ไลน์',
      body: 'กดเล่นเพื่อดูการทำงานเป็นวิดีโอ หรือลากบนแถบไทม์ไลน์ไปยังจุดเวลาที่สนใจ เพื่อดูว่า ณ เวลานั้นใครกำลังใช้ CPU หรือติดค้างรออะไรอยู่',
    },
    {
      Icon: Stethoscope,
      title: 'กล่องวิเคราะห์คอขวด',
      body: (
        <>
          ระบบเปรียบเหมือน "หมอตรวจอาการ" ถ้าเจอว่าระบบช้าเพราะอะไร จะมีปุ่ม <strong className="font-medium text-ink">"กดปรับใช้ค่านี้ทันที"</strong> ให้คุณกดทดลองแก้ได้ใน 1 คลิก
        </>
      ),
    },
    {
      Icon: ListOrdered,
      title: 'ช่องคิว 4 กล่อง',
      body: (
        <>
          <strong className="font-medium text-ink">Running</strong> = กำลังรัน, <strong className="font-medium text-ink">Ready</strong> = รอคิว CPU,{' '}
          <strong className="font-medium text-ink">Waiting I/O</strong> = รอดิสก์, <strong className="font-medium text-ink">Waiting Memory</strong> = ติดค้างรอโหลดแรม
        </>
      ),
    },
    {
      Icon: MemoryStick,
      title: 'ช่องแรม 16 ช่อง (F0–F15)',
      body: 'ดูว่าโปรเซสไหนกำลังยึดครองช่องในแรม หากช่องเต็มแล้วมีงานใหม่เข้ามา จะต้องมีคนโดนเตะออกตามกฎ (LRU หรือ FIFO)',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="guide-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-modal-title"
            className="bg-surface border border-line rounded-xl shadow-pop w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
              <div>
                <h2 id="guide-modal-title" className="text-lg font-semibold text-ink">
                  คู่มือทฤษฎีระบบปฏิบัติการ
                </h2>
                <p className="mt-0.5 text-sm text-muted">เรียนรู้กลไกของระบบปฏิบัติการผ่านการจำลองหลายทรัพยากร</p>
              </div>
              <button
                onClick={onClose}
                aria-label="ปิด"
                className="shrink-0 text-muted hover:text-ink hover:bg-surface-muted rounded-md p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="หัวข้อคู่มือ" className="flex gap-5 px-5 border-b border-line overflow-x-auto">
              {TABS.map((t) => {
                const selected = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(t.id)}
                    className={`shrink-0 -mb-px py-2.5 border-b-2 text-sm font-medium transition-colors ${
                      selected ? 'border-primary text-ink' : 'border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto px-5 py-5 text-sm text-ink leading-relaxed">
              {activeTab === 'intro' && (
                <div className="space-y-5">
                  <section className="space-y-2">
                    <h3 className="text-base font-semibold">คอมพิวเตอร์ไม่ได้ช้าเพราะส่วนใดส่วนหนึ่ง แต่ส่งผลต่อกันเป็นลูกโซ่</h3>
                    <p className="max-w-prose">
                      เวลาเปิดคอมแล้วเครื่องค้าง หลายคนคิดว่าซีพียู (CPU) ไม่แรงพอ แต่บ่อยครั้งปัญหาเริ่มต้นจาก{' '}
                      <strong className="font-semibold">"แรมไม่พอ"</strong> ทำให้ระบบต้องนำฮาร์ดดิสก์ (Disk)
                      มาจำลองเป็นแรมชั่วคราว ซึ่งดิสก์ทำงานช้ากว่าแรมเป็นพันเท่า
                    </p>
                  </section>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {resources.map((r) => (
                      <div key={r.title} className="border border-line rounded-lg p-4 space-y-1.5">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          {r.title}
                        </h4>
                        <p className="text-sm text-muted leading-relaxed">{r.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="space-y-4">
                  <p className="max-w-prose text-muted">
                    กดปุ่ม <span className="font-medium text-ink">ลองตั้งค่านี้</span> ในการทดลองด้านล่าง แล้วกด{' '}
                    <span className="font-medium text-ink">Run simulation</span> เพื่อดูผลจริง
                  </p>

                  {labs.map((lab) => (
                    <section key={lab.title} className="border border-line rounded-lg p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <h3 className="text-base font-semibold">{lab.title}</h3>
                        <button onClick={lab.onApply} className={`${SECONDARY_BUTTON} shrink-0 self-start`}>
                          {lab.action}
                        </button>
                      </div>
                      <p className="max-w-prose text-muted">
                        <span className="font-medium text-ink">สิ่งที่ควรสังเกต</span> {lab.body}
                      </p>
                    </section>
                  ))}
                </div>
              )}

              {activeTab === 'controls' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cheatSheet.map(({ Icon, title, body }) => (
                    <div key={title} className="border border-line rounded-lg p-4 space-y-1.5">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Icon size={16} className="text-primary shrink-0" />
                        {title}
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-line">
              <p className="text-sm text-muted">
                คำแนะนำ: ลองเล่น Lab 1 เพื่อเข้าใจปรากฏการณ์ Thrashing ซึ่งเป็นจุดเด่นที่สุดของโปรเจกต์นี้
              </p>
              <button onClick={onClose} className={`${SECONDARY_BUTTON} shrink-0`}>
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
