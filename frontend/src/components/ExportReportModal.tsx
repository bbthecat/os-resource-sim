import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismiss, backdropDismiss } from '../hooks/useDismiss';
import { useSimStore } from '../store/useSimStore';
import { Download, Copy, Check, Printer, X } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors';

const OPTION_CARD =
  'text-left p-4 rounded-lg border border-line hover:border-primary/50 hover:bg-primary-soft/40 transition-colors';

export default function ExportReportModal({ isOpen, onClose }: Readonly<ExportReportModalProps>) {
  useDismiss(isOpen, onClose);
  const { result, config } = useSimStore();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

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

  const preview: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Workload', value: config.workload, mono: true },
    { label: 'Scheduler', value: config.scheduler, mono: true },
    { label: 'Avg turnaround', value: `${metrics.avg_turnaround.toFixed(2)} ticks` },
    { label: 'Avg wait', value: `${metrics.avg_waiting.toFixed(2)} ticks` },
    { label: 'Page faults', value: String(metrics.total_page_faults) },
    { label: 'Jain fairness', value: metrics.fairness.toFixed(3) },
    { label: 'Throughput', value: `${metrics.throughput.toFixed(4)} proc/tick` },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="export-overlay"
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
            aria-labelledby="export-modal-title"
            className="bg-surface border border-line rounded-xl shadow-pop w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
              <div>
                <h2 id="export-modal-title" className="text-lg font-semibold text-ink">
                  ส่งออกผลการจำลอง
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  ส่งออกตัวชี้วัดและข้อมูลโปรเซสเป็น CSV หรือ Markdown สำหรับจัดทำเอกสารประกอบโครงงาน
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

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4 text-sm text-ink">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleDownloadCSV} className={OPTION_CARD}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Download size={16} className="text-primary" />
                    Export CSV (.csv)
                  </span>
                  <span className="block mt-1 text-sm text-muted">สำหรับ Excel, Google Sheets, Python Pandas</span>
                </button>

                <button onClick={handleCopyMarkdown} className={OPTION_CARD}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} className="text-primary" />}
                    {copied ? 'คัดลอกแล้ว' : 'Copy Markdown table'}
                  </span>
                  <span className="block mt-1 text-sm text-muted">สำหรับ Notion, GitHub หรือ Word</span>
                </button>
              </div>

              {/* Quick preview */}
              <div className="bg-surface-muted rounded-lg p-4">
                <p className="mb-2 text-xs font-medium text-muted">ตัวอย่างข้อมูลที่ส่งออก</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {preview.map(({ label, value, mono }) => (
                    <div key={label} className="contents">
                      <dt className="text-muted">{label}</dt>
                      <dd className={`text-ink tabular-nums ${mono ? 'font-mono' : ''}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-line">
              <button onClick={() => window.print()} className={SECONDARY_BUTTON}>
                <Printer size={14} className="text-muted" />
                Print view
              </button>
              <button onClick={onClose} className={SECONDARY_BUTTON}>
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
