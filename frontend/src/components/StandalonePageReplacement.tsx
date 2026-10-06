import { useState, useMemo } from 'react';

// Types
type Algorithm = 'FIFO' | 'LRU' | 'Optimal';

interface TraceStep {
  ref: number;
  frames: (number | null)[];
  isHit: boolean;
  evicted: number | null;
}

export default function StandalonePageReplacement() {
  const [refString, setRefString] = useState('7,0,1,2,0,3,0,4,2,3,0,3,2,3');
  const [numFrames, setNumFrames] = useState(4);
  const [algo, setAlgo] = useState<Algorithm>('LRU');

  const trace = useMemo(() => {
    const refs = refString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const steps: TraceStep[] = [];
    const frames: (number | null)[] = Array(numFrames).fill(null);
    let faultCount = 0;
    
    // Algorithm states
    const lruQueue: number[] = [];
    const fifoQueue: number[] = [];

    for (let i = 0; i < refs.length; i++) {
      const page = refs[i];
      let isHit = false;
      let evicted: number | null = null;
      let frameIdx = frames.indexOf(page);

      if (frameIdx !== -1) {
        // Hit
        isHit = true;
        if (algo === 'LRU') {
          // Move to back of LRU queue (most recently used)
          const qIdx = lruQueue.indexOf(page);
          if (qIdx !== -1) lruQueue.splice(qIdx, 1);
          lruQueue.push(page);
        }
      } else {
        // Miss
        isHit = false;
        faultCount++;
        
        let emptyIdx = frames.indexOf(null);
        if (emptyIdx !== -1) {
          // There is an empty frame
          frames[emptyIdx] = page;
          fifoQueue.push(page);
          lruQueue.push(page);
        } else {
          // Need to evict
          let victim = -1;
          if (algo === 'FIFO') {
            victim = fifoQueue.shift()!;
          } else if (algo === 'LRU') {
            victim = lruQueue.shift()!;
          } else if (algo === 'Optimal') {
            // Find page that will not be used for longest time
            let maxDistance = -1;
            for (const fPage of frames) {
              if (fPage === null) continue;
              const nextUse = refs.indexOf(fPage, i + 1);
              if (nextUse === -1) {
                victim = fPage;
                break;
              }
              if (nextUse > maxDistance) {
                maxDistance = nextUse;
                victim = fPage;
              }
            }
          }
          
          evicted = victim;
          emptyIdx = frames.indexOf(victim);
          if (emptyIdx !== -1) {
            frames[emptyIdx] = page;
            if (algo === 'FIFO') fifoQueue.push(page);
            if (algo === 'LRU') lruQueue.push(page);
          }
        }
      }
      
      steps.push({
        ref: page,
        frames: [...frames],
        isHit,
        evicted
      });
    }
    
    return { steps, faultCount, refs };
  }, [refString, numFrames, algo]);

  return (
    <div className="glass-panel border border-border-subtle rounded-xl p-6 space-y-6 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#166534]">Page Replacement Visualizer (Standalone)</h2>
          <p className="text-sm text-slate-500">พิมพ์ตัวเลขด้านล่างแล้วมันจะวาดตารางเหมือนในตำราให้เลย!</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#166534]">Algorithm:</span>
            <select 
              value={algo} 
              onChange={e => setAlgo(e.target.value as Algorithm)}
              className="border border-[#86efac] text-[#166534] font-bold rounded px-2 py-1 bg-[#f0fdf4] outline-none cursor-pointer"
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
              <option value="Optimal">Optimal</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#166534]">Frames:</span>
            <input 
              type="number" 
              min={1} 
              max={10} 
              value={numFrames} 
              onChange={e => setNumFrames(parseInt(e.target.value) || 4)}
              className="border border-[#86efac] text-[#166534] font-bold rounded px-2 py-1 bg-[#f0fdf4] w-16 text-center outline-none"
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#166534]">Page Reference String (ใส่ตัวเลขคั่นด้วยลูกน้ำ):</label>
        <input 
          type="text" 
          value={refString}
          onChange={e => setRefString(e.target.value)}
          className="border border-slate-300 focus:border-[#22c55e] rounded px-3 py-2 w-full font-mono text-sm outline-none transition-colors"
          placeholder="e.g. 7,0,1,2,0,3,0,4,2,3,0,3,2,3"
        />
      </div>
      
      {/* Textbook Output Area */}
      <div className="mt-8 bg-white p-6 rounded-lg border border-slate-200 overflow-x-auto shadow-inner" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-2 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[#166534] text-lg leading-tight">Page<br/>reference</span>
            <span className="text-[#166534] text-lg ml-2 sm:ml-4 tracking-widest">{refString}</span>
          </div>
          <span className="text-[#166534] text-lg">No. of Page frame - {numFrames}</span>
        </div>
        
        <div className="flex items-start gap-4 sm:gap-6 ml-16">
          {trace.steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center w-10 sm:w-12 shrink-0">
              <div className="text-[#166534] text-lg mb-2">{step.ref}</div>
              
              <div className="border border-[#166534] flex flex-col w-full bg-white">
                {step.frames.map((frameVal, fIdx) => (
                  <div 
                    key={fIdx} 
                    className="h-10 sm:h-12 border-b border-[#166534] flex items-center justify-center text-[#166534] text-lg last:border-b-0"
                  >
                    {frameVal !== null ? frameVal : ''}
                  </div>
                ))}
              </div>
              
              <div className={`mt-4 text-sm sm:text-base ${step.isHit ? 'text-[#166534]' : 'text-[#166534]'}`}>
                {step.isHit ? 'Hit' : 'Miss'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-[#166534] text-xl px-2">
          Total Page Fault = {trace.faultCount}
        </div>
        
        <div className="mt-8 text-center text-[#166534] text-base">
          Here {algo} has {algo === 'Optimal' ? 'minimum' : ''} page faults for this reference string.
        </div>
      </div>
    </div>
  );
}
