import { useSimStore } from '../store/useSimStore';
import { Lightbulb, GitCompare } from 'lucide-react';

interface BottleneckCardProps {
  onOpenCompare?: () => void;
}

// What to try next: the suggestion callout + the evidence behind the verdict.
// The verdict itself (title, recommendation) is shown by ExecutiveSummary right above.
export default function BottleneckCard({ onOpenCompare }: Readonly<BottleneckCardProps>) {
  const { result, config, setConfig } = useSimStore();

  if (!result?.diagnosis) return null;

  const { diagnosis } = result;

  const isHealthy = diagnosis.label === 'BALANCED' || diagnosis.label === 'UNDERUTILIZED';

  const applySuggestedConfig = () => {
    if (diagnosis.suggested_config && Object.keys(diagnosis.suggested_config).length > 0) {
      setConfig({
        ...config,
        ...diagnosis.suggested_config,
      });
    }
  };

  const hasSuggestions = diagnosis.suggested_config && Object.keys(diagnosis.suggested_config).length > 0;
  const hasEvidence = diagnosis.evidence && Object.keys(diagnosis.evidence).length > 0;

  const getLabelThai = (lbl: string) => {
    switch (lbl) {
      case 'CPU_BOUND':
        return 'ซีพียูทำงานหนักเกินไป (CPU-Bound)';
      case 'IO_BOUND':
        return 'ดิสก์ I/O เป็นคอขวด (I/O-Bound)';
      case 'THRASHING':
        return 'วิกฤตแรมไม่พอ เกิด Thrashing รุนแรง';
      case 'MEMORY_PRESSURE':
        return 'แรมเริ่มตึงตัว (Memory Pressure)';
      case 'BALANCED':
        return 'ระบบทำงานสมดุลดี (Balanced)';
      case 'UNDERUTILIZED':
        return 'ระบบโหลดเบา ทรัพยากรเหลือเฟือ';
      case 'UNFAIR':
        return 'การจัดคิวไม่เป็นธรรมต่องานบางตัว';
      default:
        return lbl;
    }
  };

  const translateKey = (k: string) => {
    const map: Record<string, string> = {
      cpu_util: 'การใช้ CPU',
      ram_util: 'การใช้ RAM',
      disk_util: 'การใช้ Disk',
      page_fault_rate: 'อัตรา Page Fault',
      avg_ready_queue: 'คิวรอเฉลี่ย',
      thrashing_fraction: 'สัดส่วน Thrashing',
      fairness: 'ดัชนีความเป็นธรรม',
      swap_share: 'สัดส่วนเวลา Swap แรม',
    };
    return map[k] || k.replace(/_/g, ' ');
  };

  return (
    <section aria-label="สิ่งที่ควรลองต่อ" className="space-y-4">
      {/* Suggested action */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-[3px] rounded-r-lg px-4 py-3 ${
          isHealthy ? 'border-primary bg-primary-soft/50' : 'border-warning bg-warning-soft'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0 text-sm">
          <Lightbulb size={16} className={`shrink-0 mt-0.5 ${isHealthy ? 'text-primary' : 'text-warning'}`} />
          {hasSuggestions ? (
            <div className="min-w-0 space-y-1.5">
              <p className="font-medium text-ink">ค่าคอนฟิกที่แนะนำ</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(diagnosis.suggested_config).map(([key, val]) => (
                  <code
                    key={key}
                    className="font-mono text-xs text-ink bg-surface border border-line rounded-md px-1.5 py-0.5"
                  >
                    {key}: {String(val)}
                  </code>
                ))}
              </div>
              <p className="text-muted">กดปรับใช้เพื่อใส่ค่านี้ในแถบด้านซ้าย แล้วรันใหม่เพื่อเทียบผล</p>
            </div>
          ) : (
            <p className="text-ink leading-relaxed">สามารถทดลองเปรียบเทียบพารามิเตอร์เพื่อศึกษาผลกระทบได้ทันที</p>
          )}
        </div>

        {(hasSuggestions || onOpenCompare) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 pl-[26px] sm:pl-0">
            {hasSuggestions && (
              <button
                onClick={applySuggestedConfig}
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                ปรับใช้ค่าแนะนำ
              </button>
            )}
            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors"
              >
                <GitCompare size={15} className="text-primary shrink-0" />
                เปรียบเทียบ A/B
              </button>
            )}
          </div>
        )}
      </div>

      {/* Evidence */}
      {hasEvidence && (
        <div>
          <h3 className="text-xs font-medium text-muted">
            ตัวชี้วัดที่ใช้สรุปว่า{getLabelThai(diagnosis.label)}
          </h3>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {Object.entries(diagnosis.evidence).map(([key, val]) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="text-muted">{translateKey(key)}</dt>
                <dd className="font-medium text-ink tabular-nums">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
