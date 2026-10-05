import { create } from 'zustand';
import { SimConfig, SimResult } from '../types/sim';

interface SimStore {
  config: SimConfig;
  result: SimResult | null;
  currentTick: number;
  isPlaying: boolean;
  speed: number;
  setConfig: (config: SimConfig) => void;
  setResult: (result: SimResult) => void;
  setTick: (tick: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
}

export const useSimStore = create<SimStore>((set) => ({
  config: {
    workload: 'mixed',
    scheduler: 'rr',
    quantum: 4,
    ram_frames: 16,
    replacement: 'lru',
    disk_service_time: 5,
    aging_interval: 0,
    seed: 42,
    max_ticks: 5000,
  },
  result: null,
  currentTick: 0,
  isPlaying: false,
  speed: 10, // ticks per second
  setConfig: (config) => set({ config }),
  setResult: (result) => set({ result, currentTick: 0, isPlaying: false }),
  setTick: (currentTick) => set({ currentTick }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ speed }),
}));
