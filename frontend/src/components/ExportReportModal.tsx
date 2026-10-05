import { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { Download, Copy, Check, Printer, X, FileSpreadsheet } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const { result, config } = useSimStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const { metrics, diagnosis } = result;

  // Generate CSV Content
  const generateCSV = () => {
    const lines: string[] = [];
    lines.push('=== OS Resource Simulator - Simulation Report ===');
    lines.push(`Workload,${config.workload}`);
    lines.push(`Scheduler,${config.scheduler}`);
    lines.push(`Quantum,${config.quantum}`);
    lines.push(`RAM Frames,${config.ram_frames}`);
    lines.push(`Replacement,${config.replacement}`);
    lines.push(`Diagnosis Label,${diagnosis?.label || 'N/A'}`);
    lines.push('');
    lines.push('=== System Metrics ===');
    lines.push('Metric,Value');
    lines.push(`Total Ticks,${metrics.total_ticks}`);
    lines.push(`CPU Utilization,${(metrics.cpu_util * 100).toFixed(2)}%`);
    lines.push(`RAM Utilization,${(metrics.ram_util * 100).toFixed(2)}%`);
    lines.push(`Disk Utilization,${(metrics.disk_util * 100).toFixed(2)}%`);
    lines.push(`Total Page Faults,${metrics.total_page_faults}`);
    lines.push(`Page Fault Rate,${(metrics.page_fault_rate * 100).toFixed(2)}%`);
    lines.push(`Average Turnaround Time,${metrics.avg_turnaround.toFixed(2)} ticks`);
    lines.push(`Average Waiting Time,${metrics.avg_waiting.toFixed(2)} ticks`);
    lines.push(`Average Response Time,${metrics.avg_response.toFixed(2)} ticks`);
    lines.push(`Throughput,${metrics.throughput.toFixed(4)} proc/tick`);
    lines.push(`Fairness Index (Jain),${metrics.fairness.toFixed(4)}`);
    lines.push('');
    lines.push('=== Per-Process Metrics ===');
    lines.push('PID,Arrival,Priority,Status,Turnaround,WaitTime,ResponseTime,PageFaults');
    
    if (metrics.per_process) {
      for (const p of metrics.per_process) {
        lines.push(`${p.pid},${p.arrival},${p.priority ?? '-'},${p.state},${p.turnaround ?? '-'},${p.wait_time ?? '-'},${p.response ?? '-'},${p.page_faults ?? 0}`);
      }
    }

    return lines.join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `os_sim_report_${config.workload}_${config.scheduler}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateMarkdown = () => {
    let md = `## OS Resource Simulator Report\n\n`;
    md += `**Configuration:** Workload: \`${config.workload}\` | Scheduler: \`${config.scheduler}\` | Quantum: \`${config.quantum}\` | RAM: \`${config.ram_frames}\` frames | Algo: \`${config.replacement}\`\n\n`;
    md += `### Summary Metrics\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| CPU Utilization | ${(metrics.cpu_util * 100).toFixed(1)}% |\n`;
    md += `| RAM Utilization | ${(metrics.ram_util * 100).toFixed(1)}% |\n`;
    md += `| Disk Utilization | ${(metrics.disk_util * 100).toFixed(1)}% |\n`;
    md += `| Total Page Faults | ${metrics.total_page_faults} |\n`;
    md += `| Avg Turnaround Time | ${metrics.avg_turnaround.toFixed(1)} ticks |\n`;
    md += `| Avg Wait Time | ${metrics.avg_waiting.toFixed(1)} ticks |\n`;
    md += `| Throughput | ${metrics.throughput.toFixed(3)} proc/tick |\n`;
    md += `| Fairness (Jain Index) | ${metrics.fairness.toFixed(3)} |\n\n`;
    md += `**Diagnosis:** **${diagnosis?.label || 'N/A'}** - ${diagnosis?.recommendation || ''}\n`;
    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 border border-white/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-pastel-green/20 via-white to-pastel-blue/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-600 shadow-sm">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">ส่งออกข้อมูลและรายงาน (Export Simulation Data)</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">ดาวน์โหลดผลการจำลองในรูปแบบ CSV หรือ Markdown สำหรับจัดทำรายงาน</p>
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
          <p className="leading-relaxed text-slate-600 font-medium text-xs">
            ส่งออกตัวชี้วัดและข้อมูลโปรเซสสำหรับการจัดทำเอกสารประกอบโครงงาน:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={handleDownloadCSV}
              className="p-4 rounded-2xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-200/80 hover:border-emerald-400 flex flex-col items-center justify-center space-y-2 transition text-center shadow-sm hover:scale-105 active:scale-95 group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                <Download size={22} />
              </div>
              <span className="font-bold text-slate-800 text-xs">Export CSV (.csv)</span>
              <span className="text-[11px] text-slate-500">สำหรับ Excel, Google Sheets, Python Pandas</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="p-4 rounded-2xl bg-white hover:bg-blue-50/50 border-2 border-blue-200/80 hover:border-blue-400 flex flex-col items-center justify-center space-y-2 transition text-center shadow-sm hover:scale-105 active:scale-95 group"
            >
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                {copied ? <Check size={22} className="text-emerald-600" /> : <Copy size={22} />}
              </div>
              <span className="font-bold text-slate-800 text-xs">
                {copied ? 'คัดลอกสำเร็จแล้ว!' : 'Copy Markdown Table'}
              </span>
              <span className="text-[11px] text-slate-500">สำหรับ Notion, GitHub, หรือ Word</span>
            </button>
          </div>

          {/* Quick Preview */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1 shadow-inner">
            <div className="text-emerald-400 font-bold">// METRICS PREVIEW</div>
            <div className="text-slate-200">Workload: {config.workload} | Scheduler: {config.scheduler}</div>
            <div className="text-slate-200">Avg Turnaround: {metrics.avg_turnaround.toFixed(2)} ticks | Avg Wait: {metrics.avg_waiting.toFixed(2)} ticks</div>
            <div className="text-slate-200">Page Faults: {metrics.total_page_faults} | Jain Fairness: {metrics.fairness.toFixed(3)}</div>
            <div className="text-slate-200">Throughput: {metrics.throughput.toFixed(4)} proc/tick</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Printer size={14} />
            <span>Print View</span>
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
