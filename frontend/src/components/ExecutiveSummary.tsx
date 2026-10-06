import { useState, useMemo } from 'react';
import { useSimStore } from '../store/useSimStore';
import { CheckCircle2, AlertTriangle, ChevronDown, FastForward, Radio, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// The verdict for the overview tab: open content on the page background, not a card
export default function ExecutiveSummary() {
  const { result, currentTick, setTick } = useSimStore();
  const [showLogic, setShowLogic] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'overall'>('live');

  // Real-time live cumulative metrics up to currentTick
  // (computed before the early return so the hook order stays stable between renders)
  const liveMetrics = useMemo(() => {
    if (!result?.snapshots || result.snapshots.length === 0) return null;
    const count = Math.min(currentTick + 1, result.snapshots.length);
    const snaps = result.snapshots.slice(0, count);
    const n = snaps.length || 1;

    const cpuBusy = snaps.filter(s => s.cpu_busy).length;
    const diskBusy = snaps.filter(s => s.disk_busy).length;
    const thrashingCount = snaps.filter(s => s.thrashing).length;

    // same definition as the backend metric: faults / memory accesses
    let pageFaultCount = 0;
    let memAccessCount = 0;
    snaps.forEach(s => {
      s.events?.forEach(e => {
        if (e.startsWith('page_fault')) pageFaultCount++;
        else if (e.startsWith('mem_access:')) memAccessCount++;
      });
    });

    const lastSnap = snaps[snaps.length - 1];
    const readyQueueLen = lastSnap?.ready ? lastSnap.ready.length : 0;

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
      pageFaultRate: memAccessCount > 0 ? (pageFaultCount / memAccessCount) * 100 : 0,
      thrashingFraction: (thrashingCount / n) * 100,
      readyQueue: readyQueueLen,
      finishedProcs,
    };
  }, [result, currentTick]);

  if (!result?.diagnosis) return null;

  const { diagnosis, metrics } = result;
  const isHealthy = diagnosis.label === 'BALANCED' || diagnosis.label === 'UNDERUTILIZED';
  const isCritical = diagnosis.label === 'THRASHING';
  const maxTick = result.snapshots ? Math.max(0, result.snapshots.length - 1) : 0;
  const isAtEnd = currentTick >= maxTick;

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

  const stats = [
    { label: 'CPU ใช้งาน', value: activeMetrics.cpu },
    { label: 'Disk ใช้งาน', value: activeMetrics.disk },
    { label: 'อัตรา page fault', value: activeMetrics.fault },
    { label: 'Thrashing', value: activeMetrics.thrash },
    { label: 'คิว Ready', value: activeMetrics.ready },
    { label: 'ทำงานเสร็จ', value: activeMetrics.finished },
  ];

  const modes = [
    { id: 'live' as const, label: 'Real-time', Icon: Radio },
    { id: 'overall' as const, label: 'ภาพรวมทั้งหมด', Icon: BarChart3 },
  ];

  const StatusIcon = isHealthy ? CheckCircle2 : AlertTriangle;
  let statusIconTone = 'text-warning';
  if (isHealthy) statusIconTone = 'text-primary';
  else if (isCritical) statusIconTone = 'text-danger';

  return (
    <section aria-labelledby="executive-summary-title" className="space-y-5">
      {/* Context line + view controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {isLive ? 'แนวโน้มการวินิจฉัยจากการรันทั้งหมด' : 'ผลการวินิจฉัยหลังรันจบ'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="inline-flex bg-surface-muted p-1 rounded-lg">
            <legend className="sr-only">มุมมองตัวเลข</legend>
            {modes.map(({ id, label, Icon }) => {
              const selected = viewMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                    selected ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={14} className={selected ? 'text-primary' : undefined} />
                  {label}
                </button>
              );
            })}
          </fieldset>

          {!isAtEnd && (
            <button
              onClick={() => setTick(maxTick)}
              title="ข้ามไปดูจุดสิ้นสุดของการจำลอง"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors"
            >
              <FastForward size={14} className="text-muted" />
              ดูผลท้ายสุด
            </button>
          )}
        </div>
      </div>

      {/* Verdict */}
      <div className="space-y-2">
        <h2
          id="executive-summary-title"
          className="flex items-start gap-2.5 text-xl sm:text-2xl font-semibold leading-snug text-ink"
        >
          <StatusIcon size={20} aria-hidden="true" className={`shrink-0 mt-1 sm:mt-1.5 ${statusIconTone}`} />
          <span>
            <span className="sr-only">{isHealthy ? 'ระบบสมดุล: ' : 'พบคอขวด: '}</span>
            {diagnosis.title}
          </span>
        </h2>
        <p className="text-muted leading-relaxed max-w-3xl">{diagnosis.recommendation}</p>
      </div>

      {/* Key stats */}
      <div className="pt-4 border-t border-line">
        <p className="text-xs text-muted mb-3">
          {isLive ? (
            <>
              ตัวเลขสะสมถึง tick <span className="font-mono tabular-nums">{currentTick}</span> จาก{' '}
              <span className="font-mono tabular-nums">{maxTick}</span> และอัปเดตตามไทม์ไลน์
            </>
          ) : (
            <>
              ค่าตลอดการจำลอง <span className="font-mono tabular-nums">{maxTick}</span> tick
            </>
          )}
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Rule explanation */}
      <div>
        <button
          onClick={() => setShowLogic(!showLogic)}
          aria-expanded={showLogic}
          aria-controls="executive-summary-logic"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink rounded-md transition-colors"
        >
          ทำไมระบบถึงสรุปแบบนี้
          <ChevronDown size={15} className={`transition-transform ${showLogic ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence initial={false}>
          {showLogic && (
            <motion.div
              id="executive-summary-logic"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="mt-3 ml-1 pl-4 border-l-2 border-line space-y-2 max-w-3xl"
            >
              <p className="text-sm text-ink leading-relaxed">{getRuleExplanation()}</p>
              <p className="text-xs text-muted leading-relaxed">
                เกณฑ์มาจากเงื่อนไขตามทฤษฎี OS ใน <span className="font-mono">sim/analyzer.py</span>{' '}
                ทุกข้อสรุปคำนวณจากสถิติจริงของการจำลองรอบนี้ ไม่ได้ใช้ AI หรือสุ่มข้อความ
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
