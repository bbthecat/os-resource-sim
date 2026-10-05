import { useSimStore } from '../store/useSimStore';
import { Activity, Lightbulb, ArrowRight, GitCompare } from 'lucide-react';

interface BottleneckCardProps {
  onOpenCompare?: () => void;
}

export default function BottleneckCard({ onOpenCompare }: BottleneckCardProps) {
  const { result, config, setConfig } = useSimStore();

  if (!result || !result.diagnosis) return null;

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
    <div className={`p-4 rounded-xl border shadow-subtle space-y-3.5 ${
      isHealthy 
        ? 'bg-white border-pastel-green' 
        : 'bg-white border-pastel-yellow'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-md ${isHealthy ? 'bg-pastel-green text-emerald-600' : 'bg-pastel-yellow text-amber-600'}`}>
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">การวินิจฉัยคอขวดของระบบ</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">SYSTEM BOTTLENECK TELEMETRY</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-sm ${
          isHealthy
            ? 'bg-pastel-green/40 text-emerald-700 border-pastel-green'
            : 'bg-pastel-yellow/40 text-amber-700 border-pastel-yellow'
        }`}>
          {getLabelThai(diagnosis.label)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 p-3 rounded-md border border-border-subtle">
          <h4 className="text-xs font-bold text-slate-800 mb-1">{diagnosis.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="text-blue-600 font-bold">คำแนะนำเชิงวิศวกรรม: </span>
            {diagnosis.recommendation}
          </p>
        </div>

        {/* Evidence */}
        {diagnosis.evidence && Object.keys(diagnosis.evidence).length > 0 && (
          <div className="bg-white rounded-md p-3 border border-border-subtle shadow-sm">
            <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
              Metric Evidence
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(diagnosis.evidence).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-2 rounded-md border border-border-subtle">
                  <span className="text-slate-500 block text-[10px] font-semibold">{translateKey(key)}</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Config Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-md border border-border-subtle">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Lightbulb className="text-amber-500 shrink-0" size={15} />
            {hasSuggestions ? (
              <span className="text-xs">
                ค่าคอนฟิกที่แนะนำ: <strong className="font-mono text-amber-600 text-[11px] bg-amber-100 px-1 rounded">{JSON.stringify(diagnosis.suggested_config)}</strong>
              </span>
            ) : (
              <span className="text-xs text-slate-500">สามารถทดลองเปรียบเทียบพารามิเตอร์เพื่อศึกษาผลกระทบได้ทันที</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasSuggestions && (
              <button
                onClick={applySuggestedConfig}
                className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-pastel-blue hover:bg-blue-300 text-blue-900 rounded-md text-xs font-bold transition shadow-sm"
              >
                <span>ปรับใช้ค่าแนะนำ</span>
                <ArrowRight size={13} />
              </button>
            )}
            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-md text-xs font-bold transition border border-border-subtle shadow-sm"
              >
                <GitCompare size={13} className="text-pastel-purple shrink-0" />
                <span>เปรียบเทียบ A/B</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
