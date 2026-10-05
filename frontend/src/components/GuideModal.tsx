import { useState } from 'react';
import { BookOpen, X, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSimStore } from '../store/useSimStore';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<'intro' | 'labs' | 'controls'>('intro');
  const { setConfig, config } = useSimStore();

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 border border-white/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pastel-yellow/30 via-white to-pastel-blue/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-800">
                  คู่มือและทฤษฎีระบบปฏิบัติการ (OS Learning Guide)
                </h2>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  DOCS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">เรียนรู้กลไกระบบปฏิบัติการผ่านแบบจำลอง Multi-Resource</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 px-5 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('intro')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'intro' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. พื้นฐานที่ต้องรู้ (Concepts)
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'labs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. การทดลองแนะนำ 3 ข้อ (Hands-on Labs)
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'controls' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. วิธีดูหน้าจอและปุ่มต่างๆ (Cheat Sheet)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed flex-grow">
          {activeTab === 'intro' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 sm:p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  คอมพิวเตอร์ไม่ได้ช้าเพราะส่วนใดส่วนหนึ่ง แต่ส่งผลต่อกันเป็นลูกโซ่!
                </h3>
                <p className="text-slate-700">
                  เวลาเปิดคอมแล้วเครื่องค้าง หลายคนคิดว่าซีพียู (CPU) ไม่แรงพอ แต่บ่อยครั้งปัญหาเริ่มต้นจาก <strong>"แรมไม่พอ"</strong> 
                  ทำให้ระบบต้องนำฮาร์ดดิสก์ (Disk) มาจำลองเป็นแรมชั่วคราว ซึ่งดิสก์ทำงานช้ากว่าแรมเป็นพันเท่า!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="bg-white border-2 border-indigo-100 p-4 rounded-2xl space-y-1.5 shadow-sm">
                  <span className="text-indigo-700 font-bold text-sm block">1. CPU (หน่วยประมวลผล)</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    เปรียบเหมือน "พ่อครัว" ที่ทำอาหารได้ทีละจาน มีอัลกอริทึมเช่น <strong>Round Robin</strong> ช่วยสลับเวลาให้ทุกคนได้กินเรื่อยๆ
                  </p>
                </div>
                <div className="bg-white border-2 border-emerald-100 p-4 rounded-2xl space-y-1.5 shadow-sm">
                  <span className="text-emerald-700 font-bold text-sm block">2. RAM (โต๊ะเตรียมอาหาร)</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    โต๊ะมีขนาดจำกัด (เช่น 16 ช่อง Frame) ถ้าวัตถุดิบไม่อยู่บนโต๊ะ จะเกิด <strong>Page Fault</strong> ต้องเสียเวลาเดินไปหยิบจากตู้เย็น (Disk)
                  </p>
                </div>
                <div className="bg-white border-2 border-amber-100 p-4 rounded-2xl space-y-1.5 shadow-sm">
                  <span className="text-amber-700 font-bold text-sm block">3. Disk I/O (ตู้เย็นเก็บของ)</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    จุของได้มหาศาลแต่เปิดหยิบช้ามาก ถ้าพ่อครัวสั่งของจากตู้เย็นตลอดเวลา ครัวจะหยุดชะงักเรียกว่า <strong>Thrashing</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">
                กดปุ่ม <strong>"ลองตั้งค่านี้"</strong> ในการทดลองด้านล่าง แล้วกด <strong>"เริ่มการจำลอง"</strong> เพื่อดูผลจริง:
              </p>

              {/* Lab 1 */}
              <div className="bg-rose-50/60 border border-rose-200 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-rose-600" />
                    Lab 1: ดูอาการคอมค้างเพราะแรมหมด (Thrashing)
                  </span>
                  <button
                    onClick={() => loadScenario({ workload: 'memory_hog', scheduler: 'rr', ram_frames: 8, quantum: 4 })}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                  >
                    <span>ลองตั้งค่านี้</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>สิ่งที่ควรสังเกต:</strong> แรมมีแค่ 8 ช่องแต่งานขอใช้เยอะ จะเกิดแถบแดงเตือน <em>Thrashing Alert</em> ดิสก์วิ่ง 100% แต่ CPU แทบจะว่างงาน (Idle) เพราะงานไปออรอในช่อง <em>Waiting Memory</em>
                </p>
              </div>

              {/* Lab 2 */}
              <div className="bg-indigo-50/60 border border-indigo-200 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-indigo-600" />
                    Lab 2: สลับคิวแบบ Round Robin (Time Quantum สั้น vs ยาว)
                  </span>
                  <button
                    onClick={() => loadScenario({ workload: 'cpu_heavy', scheduler: 'rr', quantum: 1, ram_frames: 32 })}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                  >
                    <span>ลองตั้งค่านี้ (Q=1)</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>สิ่งที่ควรสังเกต:</strong> เมื่อ Quantum สั้นมาก (1 tick) งานจะโดนสลับคิว (Preempt) บ่อยมาก ทำให้เวลารอคอยเฉลี่ยลดลงแต่สลับบ่อย เปรียบเทียบกับตั้ง Quantum = 16 ticks
                </p>
              </div>

              {/* Lab 3 */}
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Lab 3: การจัดการแรม LRU vs FIFO
                  </span>
                  <button
                    onClick={() => loadScenario({ workload: 'mixed', scheduler: 'rr', ram_frames: 16, replacement: 'lru' })}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                  >
                    <span>ลองตั้งค่านี้</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>สิ่งที่ควรสังเกต:</strong> ลองสลับระหว่าง <strong>LRU</strong> และ <strong>FIFO</strong> ดูว่าอัลกอริทึมไหนทำให้เกิดยอด <em>Page Fault สะสม</em> น้อยกว่ากัน
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-800 block mb-1">▶️ ปุ่ม Play / Slider เวลา</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    กดเล่นเพื่อดูการทำงานเป็นวิดีโอ หรือลาก Slider ไปยังจุดเวลาที่สนใจ เพื่อดูว่า ณ เวลานั้นใครกำลังใช้ CPU หรือติดค้างรออะไรอยู่
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-800 block mb-1">🩺 กล่องวิเคราะห์คอขวด</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    ระบบเปรียบเหมือน "หมอตรวจอาการ" ถ้าเจอว่าระบบช้าเพราะอะไร จะมีปุ่ม <strong>"กดปรับใช้ค่านี้ทันที"</strong> ให้คุณกดทดลองแก้ได้ใน 1 คลิก
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-800 block mb-1">🚦 ช่องคิว 4 กล่อง</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    <strong>Running</strong> = กำลังรัน, <strong>Ready</strong> = รอคิว CPU, <strong>Waiting I/O</strong> = รอดิสก์, <strong>Waiting Memory</strong> = ติดค้างรอโหลดแรม
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-800 block mb-1">🗂️ ช่องแรม 16 ช่อง (F0-F15)</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    ดูว่าโปรเซสไหนกำลังยึดครองช่องในแรม หากช่องเต็มแล้วมีงานใหม่เข้ามา จะต้องมีคนโดนเตะออกตามกฎ (LRU หรือ FIFO)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-medium">
            คำแนะนำ: ลองเล่น Lab 1 เพื่อเข้าใจปรากฏการณ์ Thrashing ซึ่งเป็นจุดเด่นที่สุดของโปรเจกต์นี้
          </span>
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
