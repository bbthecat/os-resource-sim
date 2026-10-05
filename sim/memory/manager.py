"""MemoryManager: frame table + page table (แทนที่แบบ global ข้าม process)"""
from __future__ import annotations

from .replacement import make_policy


class MemoryManager:
    def __init__(self, num_frames: int, policy: str = "lru") -> None:
        self.num_frames = num_frames
        self.frames: list = [None] * num_frames   # แต่ละช่อง = (pid, page) หรือ None
        self.table: dict = {}                     # (pid, page) -> frame index
        self.policy = make_policy(policy)

    def access(self, pid: int, page: int) -> bool:
        """True = hit, False = page fault"""
        idx = self.table.get((pid, page))
        if idx is None:
            return False
        self.policy.on_access(idx)
        return True

    def load(self, pid: int, page: int):
        """โหลด page เข้า RAM (เรียกเมื่อ disk โหลดเสร็จ)
        คืน (pid, page) ที่ถูกเตะออก หรือ None ถ้ายังมี frame ว่าง"""
        key = (pid, page)
        if key in self.table:
            self.policy.on_access(self.table[key])
            return None
        idx = self._free_frame()
        evicted = None
        if idx is None:
            idx = self.policy.choose_victim()
            evicted = self.frames[idx]
            del self.table[evicted]
        self.frames[idx] = key
        self.table[key] = idx
        self.policy.on_load(idx)
        return evicted

    def release(self, pid: int) -> None:
        """คืน frame ทั้งหมดของ process ที่จบแล้ว"""
        for idx, key in enumerate(self.frames):
            if key is not None and key[0] == pid:
                self.frames[idx] = None
                del self.table[key]
                self.policy.on_free(idx)

    def _free_frame(self):
        for idx, key in enumerate(self.frames):
            if key is None:
                return idx
        return None

    def frame_owners(self) -> list:
        return [None if key is None else key[0] for key in self.frames]

    def used_frames(self) -> int:
        return sum(1 for key in self.frames if key is not None)


def count_faults(refs, num_frames: int, policy: str = "lru") -> int:
    """นับ page fault ของ reference string เดี่ยว (ใช้ทดสอบกับตัวอย่างในตำรา)"""
    mm = MemoryManager(num_frames, policy)
    faults = 0
    for page in refs:
        if not mm.access(0, page):
            faults += 1
            mm.load(0, page)
    return faults
