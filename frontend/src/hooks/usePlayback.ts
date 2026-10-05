import { useEffect, useRef } from 'react';
import { useSimStore } from '../store/useSimStore';

export function usePlayback() {
  const { result, currentTick, isPlaying, speed, setTick, togglePlay } = useSimStore();
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!isPlaying || !result) return;

    const maxTick = result.snapshots.length - 1;
    if (currentTick >= maxTick) {
      togglePlay();
      return;
    }

    const msPerTick = 1000 / speed;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;

      if (delta >= msPerTick) {
        setTick(Math.min(currentTick + 1, maxTick));
        lastTimeRef.current = time;
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, result, currentTick, speed, setTick, togglePlay]);
}
