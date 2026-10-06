import { useSimStore } from '../store/useSimStore';
import { pidColor, statusStyle } from '../lib/colors';
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
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <ListOrdered size={16} className="text-muted" />
          ตารางสถิติรายโปรเซส
        </h3>
        <p className="mt-0.5 text-sm text-muted">สถานะ เวลารอ และจำนวน page fault ของแต่ละโปรเซส</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-surface-muted text-muted text-xs font-medium border-b border-line">
            <tr>
              <th className="py-2 px-3 font-medium">PID</th>
              <th className="py-2 px-3 font-medium">Priority</th>
              <th className="py-2 px-3 font-medium">Arrival</th>
              <th className="py-2 px-3 font-medium">State</th>
              <th className="py-2 px-3 font-medium">Turnaround</th>
              <th className="py-2 px-3 font-medium">Wait</th>
              <th className="py-2 px-3 font-medium">Response</th>
              <th className="py-2 px-3 font-medium" title="Page faults">PF</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc: any) => {
              const s = statusStyle(proc.state);
              return (
                <tr
                  key={proc.pid}
                  className="border-b border-line last:border-b-0 hover:bg-surface-muted/60 transition-colors"
                >
                  <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: pidColor(proc.pid) }}
                    />
                    P{proc.pid}
                  </td>
                  <td className="py-2 px-3 text-muted font-mono tabular-nums">{proc.priority ?? '-'}</td>
                  <td className="py-2 px-3 text-muted font-mono tabular-nums">T+{proc.arrival}</td>
                  <td className="py-2 px-3">
                    <span
                      title={getStatusThai(proc.state)}
                      className="inline-block rounded-full text-xs font-medium px-2 py-0.5 whitespace-nowrap cursor-help"
                      style={{ backgroundColor: s.bg, color: s.fg }}
                    >
                      {proc.state?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums">{proc.turnaround ? `${proc.turnaround}t` : '-'}</td>
                  <td className="py-2 px-3 font-mono tabular-nums">{proc.wait_time ? `${proc.wait_time}t` : '-'}</td>
                  <td className="py-2 px-3 font-mono tabular-nums">
                    {proc.response !== null && proc.response !== undefined ? `${proc.response}t` : '-'}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums font-medium text-warning">{proc.page_faults ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
