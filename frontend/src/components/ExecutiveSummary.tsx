import { useState, useMemo } from 'react';
import { useSimStore } from '../store/useSimStore';
import { 
  Lightbulb, CheckCircle2, AlertOctagon, TrendingUp, 
  Cpu, HardDrive, Layers, ChevronDown, ChevronUp, 
  FastForward, ShieldCheck, Activity, HelpCircle, Radio, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExecutiveSummary() {
  const { result, currentTick, setTick } = useSimStore();
  const [showLogic, setShowLogic] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'overall'>('live');

  if (!result || !result.diagnosis) return null;

  const { diagnosis, metrics } = result;
  const isHealthy = diagnosis.label === 'BALANCED' || diagnosis.label === 'UNDERUTILIZED';
  const maxTick = result.snapshots ? Math.max(0, result.snapshots.length - 1) : 0;
  const isAtEnd = currentTick >= maxTick;

  // Real-time live cumulative metrics up to currentTick
  const liveMetrics = useMemo(() => {
    if (!result.snapshots || result.snapshots.length === 0) return null;
    const count = Math.min(currentTick + 1, result.snapshots.length);
    const snaps = result.snapshots.slice(0, count);
    const n = snaps.length || 1;

    const cpuBusy = snaps.filter(s => s.cpu_busy).length;
    const diskBusy = snaps.filter(s => s.disk_busy).length;
    const thrashingCount = snaps.filter(s => s.thrashing).length;

    let pageFaultCount = 0;
    snaps.forEach(s => {
      if (s.events) {
        s.events.forEach(e => {
          if (e.startsWith('page_fault') || e === 'PAGE_FAULT') pageFaultCount++;
        });
      }
    });

    const lastSnap = snaps[snaps.length - 1];
    const readyQueueLen = lastSnap && lastSnap.ready ? lastSnap.ready.length : 0;

    let finishedProcs = 0;
    if (result.metrics && (result.metrics as any).per_process) {
      finishedProcs = (result.metrics as any).per_process.filter(
        (p: any) => p.finish_time !== null && p.finish_time <= currentTick
      ).length;
    } else {
      const finishedSet = new Set<string>();
      snaps.forEach(s => {
        s.events?.forEach(e => {
          if (e.startsWith('finish:')) finishedSet.add(e);
        });
      });
      finishedProcs = finishedSet.size;
    }

    return {
      cpuUtil: (cpuBusy / n) * 100,
      diskUtil: (diskBusy / n) * 100,
      pageFaultRate: n > 0 ? (pageFaultCount / n) * 100 : 0,
      thrashingFraction: (thrashingCount / n) * 100,
      readyQueue: readyQueueLen,
      finishedProcs,
    };
  }, [result, currentTick]);

  // Display metrics depending on viewMode (Live vs Overall)
  const isLive = viewMode === 'live' && !isAtEnd;
  const activeMetrics = isLive && liveMetrics ? {
    cpu: liveMetrics.cpuUtil.toFixed(1) + '%',
    disk: liveMetrics.diskUtil.toFixed(1) + '%',
    fault: liveMetrics.pageFaultRate.toFixed(1) + '%',
    thrash: liveMetrics.thrashingFraction.toFixed(1) + '%',
    ready: liveMetrics.readyQueue.toFixed(0) + ' ตัว',
    finished: liveMetrics.finishedProcs + ' ตัว',
  } : {
    cpu: (metrics.cpu_util * 100).toFixed(1) + '%',
    disk: (metrics.disk_util * 100).toFixed(1) + '%',
    fault: (metrics.page_fault_rate * 100).toFixed(1) + '%',
    thrash: (metrics.thrashing_fraction * 100).toFixed(1) + '%',
    ready: metrics.avg_ready_queue.toFixed(1) + ' ตัว',
    finished: metrics.finished_processes + ' ตัว',
  };

  // Rule explanations based on analyzer.py logic
  const getRuleExplanation = () => {
    switch (diagnosis.label) {
      case 'THRASHING':
        return `ระบบประเมินจากสถิติพบว่า: สัดส่วนเวลา Thrashing (${(metrics.thrashing_fraction * 100).toFixed(0)}% ≥ 25%) ร่วมกับ Disk เสียเวลาโหลดสลับหน้า Page (${(metrics.swap_share * 100).toFixed(0)}% ≥ 60%) ทำให้ CPU ต้องรอ I/O ตลอดเวลา`;
      case 'MEMORY_PRESSURE':
        return `ระบบประเมินจากสถิติพบว่า: Page Fault Rate (${(metrics.page_fault_rate * 100).toFixed(0)}% ≥ 10%) และ Swap Share สูง แต่ CPU ยังไม่เต็ม เกิดจาก RAM ไม่พอรองรับ Working Set`;
      case 'IO_BOUND':
        return `ระบบประเมินจากสถิติพบว่า: Disk Utilization (${(metrics.disk_util * 100).toFixed(0)}% ≥ 80%) ทำงานหนักจาก I/O ปกติของ Process เอง ไม่ใช่จากการ Paging`;
      case 'CPU_BOUND':
        return `ระบบประเมินจากสถิติพบว่า: CPU Utilization (${(metrics.cpu_util * 100).toFixed(0)}% ≥ 85%) สูงมาก และมี Process รอใน Ready Queue เฉลี่ย (${metrics.avg_ready_queue.toFixed(1)} ตัว ≥ 1.5)`;
      case 'UNDERUTILIZED':
        return `ระบบประเมินจากสถิติพบว่า: ทั้ง CPU (${(metrics.cpu_util * 100).toFixed(0)}%) และ Disk (${(metrics.disk_util * 100).toFixed(0)}%) ใช้งานต่ำกว่า 50% ไม่มีจุดติดขัด`;
      case 'BALANCED':
      default:
        return `ระบบประเมินจากสถิติพบว่า: ทรัพยากรทั้งหมด (CPU, RAM, Disk) อยู่ในระดับสมดุล ไม่เกินค่า Threshold วิกฤต`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel border-l-4 rounded-2xl p-5 sm:p-6 shadow-card relative overflow-hidden transition-all duration-300 ${
        isHealthy ? 'border-l-emerald-400' : 'border-l-amber-400'
      }`}
    >
      <div className={`absolute inset-0 opacity-40 bg-gradient-to-r pointer-events-none ${
        isHealthy ? 'from-pastel-green/30 to-transparent' : 'from-pastel-yellow/30 to-transparent'
      }`}></div>
      
      <div className="relative z-10 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-glow ${
              isHealthy ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              {isHealthy ? <CheckCircle2 size={24} /> : <AlertOctagon size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  {isLive ? 'สถานะ Real-time Telemetry (ขณะกำลังจำลอง)' : 'สรุปผลการประเมินภาพรวมหลังรันเสร็จ (Post-Run Summary)'}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isHealthy ? 'ระบบสมดุล (STABLE)' : 'พบคอขวด (BOTTLENECK)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <ShieldCheck size={14} className="text-blue-500" />
                {isLive 
                  ? `คำนวณสดสะสมตามเวลาจริงถึง Tick ${currentTick} (100% Deterministic • ไม่ใช้ AI)` 
                  : `ประเมินจากสถิติจริงตลอดการจำลอง ${maxTick} Ticks • คำนวณด้วย Rule-based Heuristics (ไม่ใช่ AI)`}
              </p>
            </div>
          </div>

          {/* Mode Switcher & Tick Info */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner text-xs">
              <button
                onClick={() => setViewMode('live')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'live' 
                    ? 'bg-white text-blue-600 shadow-sm font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio size={12} className={viewMode === 'live' ? 'text-red-500 animate-pulse' : 'text-slate-400'} />
                <span>Real-time (ตาม Tick)</span>
              </button>
              <button
                onClick={() => setViewMode('overall')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'overall' 
                    ? 'bg-white text-blue-600 shadow-sm font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={12} className={viewMode === 'overall' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>สรุปภาพรวมทั้งหมด</span>
              </button>
            </div>

            {!isAtEnd && (
              <button
                onClick={() => setTick(maxTick)}
                className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition hover:scale-105 active:scale-95"
                title="ข้ามไปดูจุดสิ้นสุดของการจำลอง"
              >
                <FastForward size={13} />
                <span>ดูผลลัพธ์ท้ายสุด</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Evaluated Metrics Pills (Now actively animating and computing per tick) */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium px-1">
            <span className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  <strong className="text-slate-700">สถิติสดสะสม ณ Tick {currentTick} / {maxTick}:</strong> (ตัวเลขจะอัปเดตแบบ Real-time เมื่อเล่น Timeline)
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <strong className="text-slate-700">สถิติภาพรวมตลอดการจำลอง ({maxTick} Ticks ทั้งหมด):</strong>
                </>
              )}
            </span>
            <span className="font-mono text-slate-400 text-[10px]">
              Tick {currentTick} of {maxTick}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <motion.div 
              key={`cpu-${activeMetrics.cpu}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><Cpu size={12} className="text-blue-500" /> CPU ใช้งาน</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.cpu}
              </div>
            </motion.div>

            <motion.div 
              key={`disk-${activeMetrics.disk}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><HardDrive size={12} className="text-purple-500" /> Disk I/O</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.disk}
              </div>
            </motion.div>

            <motion.div 
              key={`fault-${activeMetrics.fault}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><Layers size={12} className="text-amber-500" /> Page Fault</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.fault}
              </div>
            </motion.div>

            <motion.div 
              key={`thrash-${activeMetrics.thrash}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><AlertOctagon size={12} className="text-rose-500" /> Thrashing</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.thrash}
              </div>
            </motion.div>

            <motion.div 
              key={`ready-${activeMetrics.ready}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><Activity size={12} className="text-indigo-500" /> Ready คิว</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.ready}
              </div>
            </motion.div>

            <motion.div 
              key={`finished-${activeMetrics.finished}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> ทำงานเสร็จ</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {activeMetrics.finished}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Diagnosis & Recommendation Content */}
        <div className="bg-white/90 rounded-xl p-4 border border-white shadow-sm space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                {isLive ? 'แนวโน้มการวินิจฉัย (จากการรันภาพรวม):' : 'ผลการวินิจฉัยหลัก:'}
              </span>
              {isLive && (
                <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                  กำลังเล่น Timeline • ผลสรุปเต็มจะเสร็จสมบูรณ์เมื่อถึง Tick {maxTick}
                </span>
              )}
            </div>
            <p className="text-base font-bold text-slate-800">
              {diagnosis.title}
            </p>
          </div>

          <div className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={17} />
            <div className="leading-relaxed">
              <span className="font-bold text-slate-800">การวิเคราะห์: </span>
              {diagnosis.recommendation}
            </div>
          </div>
          
          {!isHealthy && diagnosis.suggested_config && Object.keys(diagnosis.suggested_config).length > 0 && (
            <div className="flex items-start gap-2.5 text-sm text-slate-700 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
              <TrendingUp className="text-blue-600 shrink-0 mt-0.5" size={17} />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-800">แนวทางปรับปรุง (What-If): </span> 
                ลองปรับค่าคอนฟิก <span className="font-mono bg-white px-2 py-0.5 rounded text-xs text-blue-700 font-bold border border-blue-200">{Object.keys(diagnosis.suggested_config).join(', ')}</span> ในแถบด้านซ้าย แล้วกดรันใหม่ เพื่อเปรียบเทียบผลลัพธ์
              </div>
            </div>
          )}

          {/* Toggleable Rule Engine Logic (Proof of Dynamic Evaluation without AI) */}
          <div className="pt-1">
            <button
              onClick={() => setShowLogic(!showLogic)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} className="text-slate-400" />
              <span>ทำไมระบบถึงสรุปแบบนี้? ดูเกณฑ์ชี้วัดทางสถิติ (Rule Evaluation)</span>
              {showLogic ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showLogic && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 pt-2 border-t border-slate-100"
                >
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
                    <p className="font-sans font-bold text-slate-700">🔍 ที่มาของบทสรุป (อิงตามสมมติฐานและเงื่อนไขทฤษฎี OS ใน sim/analyzer.py):</p>
                    <p className="font-sans text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      {getRuleExplanation()}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1 font-sans">
                      * ไม่มีการใช้ AI หรือการสุ่มข้อความ ทุกข้อสรุปคำนวณสดจากสถิติจริงของรอบการจำลองนี้แบบ 100% Deterministic
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


