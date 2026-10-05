"""BaseScheduler: interface ที่ engine เรียกใช้"""
from __future__ import annotations


class BaseScheduler:
    name = "base"

    def __init__(self, config) -> None:
        self.config = config

    def add(self, p) -> None:
        """ใส่ process เข้าคิว READY"""
        raise NotImplementedError

    def pick(self):
        """เลือกและดึง process ถัดไปออกจากคิว (ไม่มี -> None)"""
        raise NotImplementedError

    def should_preempt(self, running) -> bool:
        """เรียกก่อนรันแต่ละ tick: มีตัวในคิวที่ควรแย่ง CPU จาก running ไหม (priority)"""
        return False

    def on_tick(self, running) -> bool:
        """เรียกหลัง process ที่รันอยู่ทำงานครบ 1 tick (และยังไม่ block/จบ)
        คืน True ถ้าหมดเวลาที่ให้ (quantum) ต้อง preempt"""
        return False

    def age(self) -> None:
        """เรียกทุก tick สำหรับ process ที่รอในคิว (ใช้ทำ aging)"""

    def queue(self) -> list:
        """pid ในคิว READY ตามลำดับที่จะถูกเลือก (ให้ snapshot ใช้)"""
        raise NotImplementedError

    def __len__(self) -> int:
        return len(self.queue())
