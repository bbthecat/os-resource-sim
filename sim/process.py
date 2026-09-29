"""Process / PCB / State"""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from enum import Enum

LOCALITY = 0.8      # โอกาสที่จะเข้าถึง page ที่เพิ่งใช้ (temporal locality)
RECENT_SIZE = 3     # จำ page ล่าสุดกี่หน้า


class State(str, Enum):
    NEW = "NEW"
    READY = "READY"
    RUNNING = "RUNNING"
    WAITING_IO = "WAITING_IO"
    WAITING_MEM = "WAITING_MEM"
    DONE = "DONE"


@dataclass
class Process:
    pid: int
    arrival: int
    priority: int                 # เลขน้อย = priority สูง
    bursts: list                  # [("cpu", 5), ("io", 3), ("cpu", 2)]
    pages: int = 0                # จำนวนหน้าที่ใช้ (0 = ไม่ใช้ memory ในการจำลอง)

    state: State = State.NEW
    burst_idx: int = 0
    remaining: int = 0
    wait_time: int = 0            # เวลาที่รอใน READY
    first_run: int | None = None
    finish_time: int | None = None
    page_faults: int = 0
    mem_accesses: int = 0         # นับทุกครั้งที่พยายามเข้าถึง (รวมครั้งที่ fault)
    pending_page: int | None = None
    recent_pages: list = field(default_factory=list)
    rng: random.Random | None = field(default=None, repr=False)

    def __post_init__(self) -> None:
        if not self.bursts:
            raise ValueError(f"P{self.pid}: bursts must not be empty")
        clean = []
        for kind, dur in self.bursts:
            if kind not in ("cpu", "io"):
                raise ValueError(f"P{self.pid}: burst kind must be 'cpu' or 'io', got {kind!r}")
            if int(dur) < 1:
                raise ValueError(f"P{self.pid}: burst duration must be >= 1")
            clean.append((kind, int(dur)))
        self.bursts = clean
        if self.pages < 0:
            raise ValueError(f"P{self.pid}: pages must be >= 0")

    # ---------- สร้าง / แปลง ----------
    @classmethod
    def from_dict(cls, d: dict) -> "Process":
        return cls(
            pid=int(d["pid"]),
            arrival=int(d.get("arrival", 0)),
            priority=int(d.get("priority", 1)),
            bursts=[tuple(b) for b in d["bursts"]],
            pages=int(d.get("pages", 0)),
        )

    def to_dict(self) -> dict:
        return {
            "pid": self.pid, "arrival": self.arrival, "priority": self.priority,
            "bursts": [list(b) for b in self.bursts], "pages": self.pages,
            "state": self.state.value, "wait_time": self.wait_time,
            "first_run": self.first_run, "finish_time": self.finish_time,
            "turnaround": self.turnaround, "response": self.response,
            "page_faults": self.page_faults, "mem_accesses": self.mem_accesses,
        }

    # ---------- ค่าที่คำนวณได้ ----------
    @property
    def total_cpu(self) -> int:
        return sum(d for k, d in self.bursts if k == "cpu")

    @property
    def total_io(self) -> int:
        return sum(d for k, d in self.bursts if k == "io")

    @property
    def turnaround(self) -> int | None:
        return None if self.finish_time is None else self.finish_time - self.arrival

    @property
    def response(self) -> int | None:
        return None if self.first_run is None else self.first_run - self.arrival

    def current_burst(self):
        return self.bursts[self.burst_idx] if self.burst_idx < len(self.bursts) else None

    # ---------- โมเดลการเข้าถึง page ----------
    def next_page(self) -> int | None:
        """เลือก page ที่จะเข้าถึงครั้งถัดไป (ใช้ rng ของ process เอง
        เพื่อให้ลำดับ page ไม่ขึ้นกับ scheduler/RAM ตอนทำ What-if)"""
        if self.pages <= 0:
            return None
        if self.recent_pages and self.rng.random() < LOCALITY:
            return self.rng.choice(self.recent_pages)
        return self.rng.randrange(self.pages)

    def record_access(self, page: int) -> None:
        if page in self.recent_pages:
            self.recent_pages.remove(page)
        self.recent_pages.append(page)
        if len(self.recent_pages) > RECENT_SIZE:
            self.recent_pages.pop(0)
