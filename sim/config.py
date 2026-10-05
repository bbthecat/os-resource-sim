"""SimConfig: ค่าตั้งต้นของการจำลอง 1 รอบ (เปลี่ยนค่านี้เพื่อทำ What-if)"""
from __future__ import annotations

from dataclasses import asdict, dataclass, replace

SCHEDULERS = ("fcfs", "rr", "priority", "sjf")
REPLACEMENTS = ("fifo", "lru", "clock")


@dataclass
class SimConfig:
    scheduler: str = "rr"         # fcfs | rr | priority | sjf
    quantum: int = 4              # ใช้กับ rr
    ram_frames: int = 8           # จำนวน frame ของ RAM (รวมทุก process)
    replacement: str = "lru"      # fifo | lru | clock (แทนที่แบบ global)
    disk_service_time: int = 5    # tick ต่อการโหลด 1 page (page fault)
    aging_interval: int = 0       # priority: รอครบกี่ tick ถึงเลื่อนขึ้น 1 ระดับ (0 = ปิด)
    seed: int = 42                # กำหนดลำดับการเข้าถึง page ให้ผลซ้ำได้
    max_ticks: int = 5000         # กันวนไม่จบ

    def __post_init__(self) -> None:
        if self.scheduler not in SCHEDULERS:
            raise ValueError(f"scheduler must be one of {SCHEDULERS}, got {self.scheduler!r}")
        if self.replacement not in REPLACEMENTS:
            raise ValueError(f"replacement must be one of {REPLACEMENTS}, got {self.replacement!r}")
        if self.quantum < 1:
            raise ValueError("quantum must be >= 1")
        if self.ram_frames < 1:
            raise ValueError("ram_frames must be >= 1")
        if self.disk_service_time < 1:
            raise ValueError("disk_service_time must be >= 1")
        if self.aging_interval < 0:
            raise ValueError("aging_interval must be >= 0")
        if self.max_ticks < 1:
            raise ValueError("max_ticks must be >= 1")

    def with_changes(self, **changes) -> "SimConfig":
        """สร้าง config ใหม่จากอันเดิม (ใช้ตอน What-if)"""
        return replace(self, **changes)

    def to_dict(self) -> dict:
        return asdict(self)
