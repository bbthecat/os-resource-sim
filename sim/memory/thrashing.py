"""ตรวจ thrashing แบบ online: CPU ว่างเพราะ disk ถูกใช้โหลด page ตลอด"""
from __future__ import annotations

from collections import deque


class ThrashingDetector:
    """ในหน้าต่าง `window` tick ล่าสุด ถ้า CPU util ต่ำกว่า cpu_util_max
    และ disk ถูกใช้โหลด page อย่างน้อย swap_util_min ของเวลา ถือว่า thrashing
    (นิยามตามตำรา: ระบบใช้เวลากับ paging มากกว่างานจริง)
    """

    def __init__(self, window: int = 20, cpu_util_max: float = 0.6,
                 swap_util_min: float = 0.6) -> None:
        self.window = window
        self.cpu_util_max = cpu_util_max
        self.swap_util_min = swap_util_min
        self._samples: deque = deque(maxlen=window)

    def record(self, cpu_busy: bool, swap_busy: bool) -> None:
        self._samples.append((bool(cpu_busy), bool(swap_busy)))

    def stats(self) -> tuple[float, float]:
        n = len(self._samples) or 1
        cpu = sum(c for c, _ in self._samples) / n
        swap = sum(s for _, s in self._samples) / n
        return cpu, swap

    def check(self) -> bool:
        if len(self._samples) < self.window:
            return False
        cpu, swap = self.stats()
        return cpu < self.cpu_util_max and swap >= self.swap_util_min
