import type { Snapshot } from '../types/sim';

export interface CpuSegment {
  pid: number | null;
  start: number;
  end: number; // inclusive
  duration: number;
}

// Collapse per-tick snapshots into runs of the same running PID
export function buildCpuSegments(snapshots: Snapshot[] | undefined): CpuSegment[] {
  if (!snapshots || snapshots.length === 0) return [];

  const segs: CpuSegment[] = [];
  let current: CpuSegment | null = null;

  for (const snap of snapshots) {
    if (current && current.pid === snap.running) {
      current.end = snap.t;
      current.duration += 1;
    } else {
      if (current) segs.push(current);
      current = { pid: snap.running, start: snap.t, end: snap.t, duration: 1 };
    }
  }
  if (current) segs.push(current);
  return segs;
}
