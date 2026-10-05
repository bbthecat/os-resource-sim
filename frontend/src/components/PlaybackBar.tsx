import { useSimStore } from '../store/useSimStore';
import { Play, Pause, SkipForward, Rewind } from 'lucide-react';
import { AnimatedSlider } from './AnimatedSlider';

export default function PlaybackBar() {
  const { currentTick, isPlaying, togglePlay, setTick, result, speed, setSpeed } = useSimStore();

  const maxTick = result && result.snapshots ? Math.max(0, result.snapshots.length - 1) : 0;

  return (
    <div className="bg-white px-5 py-4 rounded-xl shadow-card flex flex-wrap items-center gap-6 border border-border-subtle">
      {/* Control Buttons */}
      <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-border-subtle shadow-inner">
        <button 
          onClick={() => setTick(0)} 
          disabled={!result} 
          title="ย้อนกลับไปจุดเริ่มต้น (Rewind to start)"
          className="p-2 hover:bg-white text-slate-500 hover:text-blue-500 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
        >
          <Rewind size={18} />
        </button>
        <button 
          onClick={togglePlay} 
          disabled={!result} 
          title={isPlaying ? "หยุดชั่วคราว (Pause)" : "เล่นต่อ (Play)"}
          className="p-2.5 bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-blue-300 hover:to-purple-300 text-slate-800 rounded-md border border-white/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
        <button 
          onClick={() => setTick(Math.min(currentTick + 1, maxTick))} 
          disabled={!result} 
          title="เดินหน้า 1 Tick (Step forward)"
          className="p-2 hover:bg-white text-slate-500 hover:text-blue-500 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Slider & Time display */}
      <div className="flex-grow min-w-[240px] pt-1 pb-2">
        {result ? (
           <AnimatedSlider
             value={currentTick}
             onValueChange={(val) => setTick(val)}
             min={0}
             max={maxTick}
             color="blue"
             label="Timeline (Tick)"
           />
        ) : (
          <div className="h-10 w-full flex flex-col justify-center gap-3 opacity-30">
             <div className="flex justify-between items-end">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Timeline</label>
             </div>
             <div className="w-full h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}
      </div>

      {/* Speed control */}
      <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-border-subtle shadow-inner">
        <span className="text-[11px] text-slate-500 font-bold px-2 uppercase tracking-wider">Speed</span>
        <select 
          value={speed} 
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          className="bg-white text-blue-600 font-bold text-xs rounded-md px-3 py-1.5 border border-border-subtle focus:border-pastel-blue focus:ring-1 focus:ring-pastel-blue outline-none transition-all font-mono shadow-sm"
        >
          <option value={1}>1x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
          <option value={25}>25x</option>
          <option value={50}>50x</option>
        </select>
      </div>
    </div>
  );
}
