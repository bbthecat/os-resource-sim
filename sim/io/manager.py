"""IOManager: disk เดียว คิว FIFO ให้บริการทีละคำขอ
คำขอมี 2 ชนิด: "io" (I/O burst ของ process) และ "page" (โหลด page จาก page fault)"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass
class IORequest:
    pid: int
    kind: str            # "io" | "page"
    page: int | None
    service: int         # tick ที่ disk ต้องใช้
    remaining: int = 0


class IOManager:
    def __init__(self) -> None:
        self.queue: deque = deque()
        self.current: IORequest | None = None
        self.busy = False                 # tick ล่าสุด disk ทำงานอยู่ไหม
        self.last_kind: str | None = None  # ชนิดคำขอที่ disk ให้บริการใน tick ล่าสุด
        self.busy_ticks = {"io": 0, "page": 0}

    def request(self, pid: int, kind: str, page, service: int) -> None:
        self.queue.append(IORequest(pid, kind, page, service))

    def tick(self) -> list:
        """ให้ disk ทำงาน 1 tick คืนรายการคำขอที่เสร็จใน tick นี้ (มากสุด 1)"""
        done = []
        if self.current is None and self.queue:
            self.current = self.queue.popleft()
            self.current.remaining = self.current.service
        self.busy = self.current is not None
        self.last_kind = None
        if self.current is not None:
            self.last_kind = self.current.kind
            self.busy_ticks[self.current.kind] += 1
            self.current.remaining -= 1
            if self.current.remaining == 0:
                done.append(self.current)
                self.current = None
        return done

    def pending_pids(self) -> list:
        """pid ที่รอ/กำลังใช้ disk (ตัวที่กำลังทำอยู่มาก่อน)"""
        pids = [self.current.pid] if self.current is not None else []
        pids.extend(r.pid for r in self.queue)
        return pids
