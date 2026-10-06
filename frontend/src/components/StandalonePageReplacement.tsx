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

  const inputClass =
    'bg-surface border border-line rounded-md text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Page replacement visualizer (standalone)</h2>
          <p className="mt-0.5 text-sm text-muted">พิมพ์ลำดับการอ้างอิงหน้าด้านล่าง แล้วระบบจะวาดตารางแบบในตำราให้</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">Algorithm</span>
            <select
              value={algo}
              onChange={e => setAlgo(e.target.value as Algorithm)}
              className={`${inputClass} px-2.5 py-1.5 cursor-pointer`}
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
              <option value="Optimal">Optimal</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">Frames</span>
            <input
              type="number"
              min={1}
              max={10}
              value={numFrames}
              onChange={e => setNumFrames(parseInt(e.target.value) || 4)}
              className={`${inputClass} px-2.5 py-1.5 w-16 text-center font-mono tabular-nums`}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="page-ref-string" className="text-sm font-medium text-ink">
          Page reference string (ใส่ตัวเลขคั่นด้วยลูกน้ำ)
        </label>
        <input
          id="page-ref-string"
          type="text"
          value={refString}
          onChange={e => setRefString(e.target.value)}
          className={`${inputClass} px-3 py-2 w-full font-mono`}
          placeholder="e.g. 7,0,1,2,0,3,0,4,2,3,0,3,2,3"
        />
      </div>

      {/* Textbook Output Area */}
      <div className="mt-8 bg-surface p-6 rounded-lg border border-line overflow-x-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-2 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-primary-ink text-lg leading-tight">Page<br/>reference</span>
            <span className="text-primary-ink text-lg ml-2 sm:ml-4 tracking-widest font-mono tabular-nums">{refString}</span>
          </div>
          <span className="text-primary-ink text-lg">
            No. of Page frame - <span className="font-mono tabular-nums">{numFrames}</span>
          </span>
        </div>

        <div className="flex items-start gap-4 sm:gap-6 ml-16">
          {trace.steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center w-10 sm:w-12 shrink-0">
              <div className="text-primary-ink text-lg mb-2 font-mono tabular-nums">{step.ref}</div>

              <div className="border border-line-strong flex flex-col w-full bg-surface">
                {step.frames.map((frameVal, fIdx) => {
                  // The frame that holds the referenced page: tinted as a fault or a hit
                  let tone = 'text-primary-ink';
                  if (frameVal === step.ref) tone = step.isHit ? 'bg-primary-soft text-primary-ink' : 'bg-danger-soft text-danger';

                  return (
                    <div
                      key={fIdx}
                      className={`h-10 sm:h-12 border-b border-line flex items-center justify-center text-lg font-mono tabular-nums last:border-b-0 ${tone}`}
                    >
                      {frameVal !== null ? frameVal : ''}
                    </div>
                  );
                })}
              </div>

              <div className={`mt-4 text-sm sm:text-base font-medium ${step.isHit ? 'text-primary-ink' : 'text-danger'}`}>
                {step.isHit ? 'Hit' : 'Miss'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-primary-ink text-xl px-2">
          Total Page Fault = <span className="font-mono tabular-nums">{trace.faultCount}</span>
        </div>

        <div className="mt-8 text-center text-primary-ink text-base">
          Here {algo} has {algo === 'Optimal' ? 'minimum' : ''} page faults for this reference string.
        </div>
      </div>
    </section>
  );
}
