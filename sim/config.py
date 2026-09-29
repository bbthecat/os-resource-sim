
from dataclasses import dataclass

@dataclass
class SimConfig:
    scheduler: str = "rr"        # fcfs | rr | priority
    quantum: int = 4
    ram_frames: int = 8
    replacement: str = "lru"     # fifo | lru
    disk_service_time: int = 5   # ticks ต่อ 1 คำขอ (page fault ก็ใช้ค่านี้)
    seed: int = 42
    max_ticks: int = 2000