import { useSimStore } from '../store/useSimStore';
import { Cpu, HardDrive, Database, AlertTriangle } from 'lucide-react';

export default function GaugeRow() {
  const { result, currentTick } = useSimStore();

  if (!result || !result.snapshots || result.snapshots.length === 0) return null;

  const currentSnapshot = result.snapshots[Math.min(currentTick, result.snapshots.length - 1)];
  if (!currentSnapshot) return null;

  const totalFrames = currentSnapshot.frames.length;
  const occupiedFrames = currentSnapshot.frames.filter(f => f !== null).length;
  const ramPercent = totalFrames > 0 ? Math.round((occupiedFrames / totalFrames) * 100) : 0;

  // Recent ticks calculation (window of last 20 ticks for dynamic util)
  const windowStart = Math.max(0, currentTick - 19);
  const recentSnapshots = result.snapshots.slice(windowStart, currentTick + 1);
  const cpuRecentBusy = recentSnapshots.filter(s => s.cpu_busy).length;
  const cpuPercent = Math.round((cpuRecentBusy / recentSnapshots.length) * 100);

  const diskRecentBusy = recentSnapshots.filter(s => s.disk_busy).length;
  const diskPercent = Math.round((diskRecentBusy / recentSnapshots.length) * 100);

  return (
    <div className="space-y-3">
      {currentSnapshot.thrashing && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg flex items-center space-x-2.5 text-xs shadow-subtle">
          <AlertTriangle className="text-rose-500 shrink-0" size={16} />
          <div>
            <span className="font-bold text-rose-600">Thrashing Alert: </span>
            <span className="text-slate-600 font-medium">ระบบสูญเสียรอบประมวลผลไปกับการสลับหน้าข้อมูลลงดิสก์อย่างต่อเนื่อง (Paging Overhead)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Utilization */}
        <div className="glass-panel border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-pastel-blue/30 rounded-md border border-pastel-blue shadow-sm">
                 <Cpu className="text-blue-600" size={16} />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block tracking-tight">CPU Utilization</span>
                <span className="text-[10px] text-slate-500 block font-mono">CORE 0</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shadow-sm ${
              currentSnapshot.cpu_busy 
                ? 'bg-pastel-blue/40 text-blue-700 border-pastel-blue' 
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}>
              {currentSnapshot.cpu_busy ? 'BUSY' : 'IDLE'}
            </span>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{cpuPercent}%</span>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 rounded">
                {currentSnapshot.running !== null ? `PID ${currentSnapshot.running}` : 'NONE'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-200 ${
                  cpuPercent > 85 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${cpuPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* RAM Utilization */}
        <div className="glass-panel border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-pastel-green/30 rounded-md border border-pastel-green shadow-sm">
                 <Database className="text-emerald-600" size={16} />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block tracking-tight">RAM Usage</span>
                <span className="text-[10px] text-slate-500 block font-mono">PHYSICAL FRAMES</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 shadow-sm">
              {occupiedFrames}/{totalFrames} frames
            </span>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{ramPercent}%</span>
              <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-50 px-1.5 rounded">
                {result.metrics ? `PF: ${result.metrics.total_page_faults}` : ''}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-200 ${
                  ramPercent > 90 ? 'bg-red-500' : ramPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${ramPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Disk I/O Utilization */}
        <div className="glass-panel border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-pastel-yellow/50 rounded-md border border-pastel-yellow shadow-sm">
                 <HardDrive className="text-amber-600" size={16} />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block tracking-tight">Disk I/O</span>
                <span className="text-[10px] text-slate-500 block font-mono">SWAP & STORAGE</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shadow-sm ${
              currentSnapshot.disk_busy 
                ? 'bg-pastel-yellow/60 text-amber-700 border-pastel-yellow' 
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}>
              {currentSnapshot.disk_busy ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{diskPercent}%</span>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 rounded">
                Queue: {currentSnapshot.disk_queue?.length || 0}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-200 ${
                  diskPercent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${diskPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
