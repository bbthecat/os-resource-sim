export interface SimConfig {
  workload: string;
  scheduler: string;
  quantum: number;
  ram_frames: number;
  replacement: string;
  disk_service_time: number;
  aging_interval: number;
  seed: number;
  max_ticks: number;
}

export interface Snapshot {
  t: number;
  running: number | null;
  ready: number[];
  waiting_io: number[];
  waiting_mem: number[];
  frames: (number | null)[];
  disk_busy: boolean;
  disk_queue: number[];
  cpu_busy: boolean;
  thrashing: boolean;
  events: string[];
}

export interface Metrics {
  total_ticks: number;
  completed: boolean;
  finished_processes: number;
  cpu_util: number;
  ram_util: number;
  disk_util: number;
  swap_share: number;
  avg_ready_queue: number;
  avg_waiting: number;
  avg_turnaround: number;
  avg_response: number;
  throughput: number;
  total_page_faults: number;
  page_fault_rate: number;
  thrashing_fraction: number;
  context_switches: number;
  fairness: number;
  per_process: any[];
}

export interface SimResult {
  config: SimConfig;
  snapshots: Snapshot[];
  metrics: Metrics;
  diagnosis: any;
}
