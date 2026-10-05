from __future__ import annotations

from .base import BaseScheduler


class SJFScheduler(BaseScheduler):
    """Shortest Job First (non-preemptive)
    
    คัดเลือก process ในคิว READY ที่มี burst duration ของ CPU ในรอบปัจจุบันสั้นที่สุด
    หากความยาวเท่ากัน ให้เรียงตามลำดับที่เข้ามาก่อน (FCFS tie-breaking)
    """
    name = "sjf"

    def __init__(self, config) -> None:
        super().__init__(config)
        self._q: list = []  # [(seq, process)]
        self._seq = 0

    def _burst_len(self, p) -> int:
        if p.remaining > 0:
            return p.remaining
        cb = p.current_burst()
        return cb[1] if cb else 0

    def _order(self) -> list:
        return sorted(self._q, key=lambda sp: (self._burst_len(sp[1]), sp[0]))

    def add(self, p) -> None:
        self._q.append((self._seq, p))
        self._seq += 1

    def pick(self):
        if not self._q:
            return None
        best = self._order()[0]
        self._q.remove(best)
        return best[1]

    def queue(self) -> list:
        return [p.pid for _, p in self._order()]
