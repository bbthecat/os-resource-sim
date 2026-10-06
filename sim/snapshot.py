"""snapshot: dict ต่อ 1 tick (สัญญากับ UI/analyzer ห้ามเปลี่ยนชื่อ key เอง)

{
  "t": 7, "running": 2 | None, "ready": [1, 3], "waiting_io": [4], "waiting_mem": [5],
  "frames": [2, 2, 1, None, ...],   # เจ้าของแต่ละ frame (pid หรือ None)
  "disk_busy": True, "disk_queue": [5, 4],
  "cpu_busy": True, "thrashing": False, "events": ["page_fault:5", "evict:2"]
}
"""
from __future__ import annotations

from .process import State


def make_snapshot(sim, ran_pid, cpu_busy: bool, thrashing: bool, events: list) -> dict:
    procs = sim.processes
    return {
        "t": sim.t,
        "running": ran_pid,
        "ready": list(sim.scheduler.queue()),
        "waiting_io": sorted(p.pid for p in procs if p.state is State.WAITING_IO),
        "waiting_mem": sorted(p.pid for p in procs if p.state is State.WAITING_MEM),
        "frames": sim.memory.frame_owners(),
        "frame_pages": sim.memory.frame_pages(),
        "disk_busy": sim.io.busy,
        "disk_queue": sim.io.pending_pids(),
        "cpu_busy": cpu_busy,
        "thrashing": thrashing,
        "events": list(events),
    }
