"""Simulation: นาฬิกา + tick loop + เก็บ snapshot ทุก tick

ลำดับใน 1 tick (ตายตัว):
  1. admit   process ที่ถึงเวลา arrival -> READY (หรือส่งไป I/O ถ้า burst แรกเป็น io)
  2. io_tick disk ทำงาน 1 tick; คำขอที่เสร็จ -> โหลด page / จบ I/O burst -> READY
  3. pick    ถ้ามีตัวในคิวที่ priority สูงกว่าตัวที่รันอยู่ -> preempt; ถ้าไม่มีตัวรัน ให้ scheduler เลือก
  4. wait    ทุกตัวที่ยังอยู่ใน READY (ไม่ได้ CPU ใน tick นี้): wait_time += 1 และ aging
  5. run     ตัวที่รันเข้าถึง page: fault -> WAITING_MEM + ส่งคำขอ disk (ไม่กิน CPU ใน tick นี้)
             ไม่ fault -> ทำงาน 1 tick; burst หมด -> io/DONE; หมด quantum -> preempt
  6. snapshot
"""
from __future__ import annotations

import copy
import random
from dataclasses import dataclass

from . import events as ev
from .config import SimConfig
from .io.manager import IOManager
from .memory.manager import MemoryManager
from .memory.thrashing import ThrashingDetector
from .process import Process, State
from .scheduler import make_scheduler
from .snapshot import make_snapshot


@dataclass
class SimResult:
    config: SimConfig
    processes: list
    snapshots: list
    mem_accesses: int
    page_faults: int
    context_switches: int
    ticks: int
    completed: bool               # False = ชน max_ticks ก่อนงานจบ
    disk_busy_ticks: dict         # {"io": n, "page": n}

    def to_dict(self) -> dict:
        return {
            "config": self.config.to_dict(),
            "processes": [p.to_dict() for p in self.processes],
            "snapshots": self.snapshots,
            "mem_accesses": self.mem_accesses,
            "page_faults": self.page_faults,
            "context_switches": self.context_switches,
            "ticks": self.ticks,
            "completed": self.completed,
            "disk_busy_ticks": self.disk_busy_ticks,
        }


class Simulation:
    def __init__(self, processes, config: SimConfig | None = None) -> None:
        self.config = config or SimConfig()
        # copy เพื่อไม่แตะ workload ต้นฉบับ (รันซ้ำ/เทียบ What-if ได้)
        self.processes = sorted(copy.deepcopy(list(processes)), key=lambda p: (p.arrival, p.pid))
        self._by_pid = {p.pid: p for p in self.processes}
        if len(self._by_pid) != len(self.processes):
            raise ValueError("duplicate pid in workload")

        self.scheduler = make_scheduler(self.config)
        self.memory = MemoryManager(self.config.ram_frames, self.config.replacement)
        self.io = IOManager()
        self.detector = ThrashingDetector()

        self.t = 0
        self.running: Process | None = None
        self.snapshots: list = []
        self.mem_accesses = 0
        self.page_faults = 0
        self.context_switches = 0
        self.done_count = 0
        self._next_arrival = 0
        self._last_ran_pid: int | None = None
        self._was_thrashing = False

    # ------------------------------------------------------------------ run
    def run(self) -> SimResult:
        total = len(self.processes)
        while self.t < self.config.max_ticks and self.done_count < total:
            self.step()
        return SimResult(
            config=self.config, processes=self.processes, snapshots=self.snapshots,
            mem_accesses=self.mem_accesses, page_faults=self.page_faults,
            context_switches=self.context_switches, ticks=self.t,
            completed=self.done_count == total,
            disk_busy_ticks=dict(self.io.busy_ticks),
        )

    def step(self) -> dict:
        t = self.t
        events: list = []
        self._admit(t, events)
        self._io_tick(t, events)
        if self.running is not None and self.scheduler.should_preempt(self.running):
            self._preempt(events)
        if self.running is None:
            self._pick(t)
        for p in self.processes:
            if p.state is State.READY:
                p.wait_time += 1
        self.scheduler.age()
        ran_pid, cpu_busy = self._run(t, events)

        self.detector.record(cpu_busy, self.io.last_kind == "page")
        thrashing = self.detector.check()
        if thrashing and not self._was_thrashing:
            events.append(ev.THRASHING_START)
        elif not thrashing and self._was_thrashing:
            events.append(ev.THRASHING_END)
        self._was_thrashing = thrashing

        snap = make_snapshot(self, ran_pid, cpu_busy, thrashing, events)
        self.snapshots.append(snap)
        self.t += 1
        return snap

    # ---------------------------------------------------------------- phases
    def _admit(self, t: int, events: list) -> None:
        procs = self.processes
        while self._next_arrival < len(procs) and procs[self._next_arrival].arrival <= t:
            p = procs[self._next_arrival]
            self._next_arrival += 1
            p.rng = random.Random(self.config.seed * 1_000_003 + p.pid)
            kind, dur = p.bursts[0]
            p.remaining = dur
            events.append(ev.arrive(p.pid))
            if kind == "cpu":
                p.state = State.READY
                self.scheduler.add(p)
            else:
                p.state = State.WAITING_IO
                self.io.request(p.pid, "io", None, dur)

    def _io_tick(self, t: int, events: list) -> None:
        for req in self.io.tick():
            p = self._by_pid[req.pid]
            if req.kind == "page":
                evicted = self.memory.load(p.pid, req.page)
                events.append(ev.page_loaded(p.pid))
                if evicted is not None:
                    events.append(ev.evict(evicted[0]))
                p.state = State.READY
                self.scheduler.add(p)
            else:
                events.append(ev.io_done(p.pid))
                if self._complete_burst(p, t, events) == "cpu":
                    p.state = State.READY
                    self.scheduler.add(p)

    def _pick(self, t: int) -> None:
        p = self.scheduler.pick()
        if p is None:
            return
        p.state = State.RUNNING
        if p.first_run is None:
            p.first_run = t
        if self._last_ran_pid is not None and self._last_ran_pid != p.pid:
            self.context_switches += 1
        self.running = p

    def _run(self, t: int, events: list):
        """คืน (pid ที่ได้ใช้ CPU/พยายามใช้ใน tick นี้, cpu_busy)"""
        p = self.running
        if p is None:
            return None, False
        self._last_ran_pid = p.pid

        if p.pages > 0:
            if p.pending_page is None:
                p.pending_page = p.next_page()
            page = p.pending_page
            p.mem_accesses += 1
            self.mem_accesses += 1
            if not self.memory.access(p.pid, page):
                p.page_faults += 1
                self.page_faults += 1
                p.state = State.WAITING_MEM
                self.io.request(p.pid, "page", page, self.config.disk_service_time)
                events.append(ev.mem_access(p.pid, page, False))
                events.append(ev.page_fault(p.pid))
                self.running = None
                return p.pid, False
            events.append(ev.mem_access(p.pid, page, True))
            p.record_access(page)
            p.pending_page = None

        p.remaining -= 1
        if p.remaining == 0:
            if self._complete_burst(p, t + 1, events) != "cpu":
                self.running = None
                return p.pid, True
            # burst cpu ต่อเนื่อง: ยังใช้ CPU ต่อได้

        if self.scheduler.on_tick(p):
            self._preempt(events)
        return p.pid, True

    # --------------------------------------------------------------- helpers
    def _preempt(self, events: list) -> None:
        p = self.running
        p.state = State.READY
        self.scheduler.add(p)
        events.append(ev.preempt(p.pid))
        self.running = None

    def _complete_burst(self, p: Process, now: int, events: list) -> str:
        """burst ปัจจุบันจบ -> ไป burst ถัดไป คืน 'cpu' | 'io' | 'done'"""
        p.burst_idx += 1
        if p.burst_idx >= len(p.bursts):
            self._finish(p, now, events)
            return "done"
        kind, dur = p.bursts[p.burst_idx]
        p.remaining = dur
        if kind == "io":
            p.state = State.WAITING_IO
            self.io.request(p.pid, "io", None, dur)
            return "io"
        return "cpu"

    def _finish(self, p: Process, now: int, events: list) -> None:
        p.state = State.DONE
        p.finish_time = now
        self.memory.release(p.pid)
        self.done_count += 1
        events.append(ev.finish(p.pid))
