# process.py
from dataclasses import dataclass, field
from enum import Enum

class State(str, Enum):
    NEW = "NEW"; READY = "READY"; RUNNING = "RUNNING"
    WAITING_IO = "WAITING_IO"; WAITING_MEM = "WAITING_MEM"; DONE = "DONE"

@dataclass
class Process:
    pid: int
    arrival: int
    priority: int
    bursts: list            # [("cpu",5), ("io",3), ("cpu",2)]
    pages: int              # จำนวนหน้าที่ใช้ (working set)
    state: State = State.NEW
    burst_idx: int = 0
    remaining: int = 0
    wait_time: int = 0
    finish_time: int | None = None
    page_faults: int = 0