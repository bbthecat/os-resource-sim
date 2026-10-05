import { useSimStore } from '../store/useSimStore';
import { pidColor, statusColor } from '../lib/colors';
import { ListOrdered } from 'lucide-react';

export default function ProcessTable() {
  const { result } = useSimStore();

  if (!result || !result.metrics || !result.metrics.per_process) return null;

  const processes = result.metrics.per_process;

  const getStatusThai = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'RUNNING':
        return 'กำลังรัน';
      case 'READY':
        return 'รอในคิว';
      case 'WAITING_IO':
        return 'รอดิสก์';
      case 'WAITING_MEM':
        return 'รอแรม (PF)';
      case 'DONE':
        return 'เสร็จสิ้น';
      case 'NEW':
        return 'เข้าใหม่';
      default:
        return state;
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-3.5 space-y-3 shadow-subtle">
      <div className="flex items-center space-x-2 border-b border-border-subtle pb-2">
        <ListOrdered className="text-blue-400" size={16} />
        <div>
          <h3 className="text-xs font-semibold text-zinc-200">ตารางสถิติรายโปรเซส</h3>
          <p className="text-[10px] text-zinc-500 font-mono">PROCESS METRICS & LIFECYCLE TABLE</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-surface-raised text-zinc-400 text-[10px] font-mono tracking-wider uppercase border-b border-border-subtle">
            <tr>
              <th className="py-2 px-2.5">PID</th>
              <th className="py-2 px-2.5">PRIO</th>
              <th className="py-2 px-2.5">ARRIVAL</th>
              <th className="py-2 px-2.5">STATE</th>
              <th className="py-2 px-2.5">TURNAROUND</th>
              <th className="py-2 px-2.5">WAIT</th>
              <th className="py-2 px-2.5">RESP</th>
              <th className="py-2 px-2.5">PF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-[11px] font-mono">
            {processes.map((proc: any) => (
              <tr key={proc.pid} className="hover:bg-surface-hover transition">
                <td className="py-2 px-2.5 font-bold font-mono">
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: pidColor(proc.pid) }}
                  />
                  P{proc.pid}
                </td>
                <td className="py-2 px-2.5 text-zinc-400">{proc.priority ?? '-'}</td>
                <td className="py-2 px-2.5 text-zinc-400">T+{proc.arrival}</td>
                <td className="py-2 px-2.5">
                  <span 
                    title={getStatusThai(proc.state)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium cursor-help"
                    style={{ 
                      backgroundColor: `${statusColor(proc.state)}15`,
                      color: statusColor(proc.state),
                      border: `1px solid ${statusColor(proc.state)}30`
                    }}
                  >
                    {proc.state?.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-zinc-200">{proc.turnaround ? `${proc.turnaround}t` : '-'}</td>
                <td className="py-2 px-2.5 text-zinc-200">{proc.wait_time ? `${proc.wait_time}t` : '-'}</td>
                <td className="py-2 px-2.5 text-zinc-200">{proc.response !== null && proc.response !== undefined ? `${proc.response}t` : '-'}</td>
                <td className="py-2 px-2.5 text-amber-400 font-semibold">{proc.page_faults ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
