from __future__ import annotations

from .base import BaseScheduler


class PriorityScheduler(BaseScheduler):
    """Preemptive priority (เลขน้อย = priority สูง) + aging (เปิดด้วย aging_interval > 0)

    aging: process ที่รอใน READY ครบ aging_interval tick จะได้ priority ดีขึ้น 1 ระดับ
    เพื่อกัน starvation; ตัวที่กำลังรันใช้ priority ณ ตอนที่ถูกเลือก (เทียบกับตัวในคิวที่ถูก aging)
    เสมอกันเลือกตามลำดับเข้าคิว (FIFO)
    """
    name = "priority"

    def __init__(self, config) -> None:
        super().__init__(config)
        self._q: list = []      # [(seq, process)]
        self._seq = 0
        self._waited: dict = {}  # pid -> tick ที่รอสะสม
        self._running_eff: int | None = None  # priority (หลัง aging) ของตัวที่ถูกเลือกไปรัน

    def _effective(self, p) -> int:
        aging = self.config.aging_interval
        boost = self._waited.get(p.pid, 0) // aging if aging > 0 else 0
        return max(0, p.priority - boost)

    def _order(self) -> list:
        return sorted(self._q, key=lambda sp: (self._effective(sp[1]), sp[0]))

    def add(self, p) -> None:
        self._q.append((self._seq, p))
        self._seq += 1
        self._waited[p.pid] = 0

    def pick(self):
        if not self._q:
            return None
        best = self._order()[0]
        self._running_eff = self._effective(best[1])
        self._q.remove(best)
        self._waited.pop(best[1].pid, None)
        return best[1]

    def age(self) -> None:
        for _, p in self._q:
            self._waited[p.pid] = self._waited.get(p.pid, 0) + 1

    def should_preempt(self, running) -> bool:
        if not self._q:
            return False
        best = self._order()[0][1]
        current = self._running_eff if self._running_eff is not None else running.priority
        return self._effective(best) < current

    def queue(self) -> list:
        return [p.pid for _, p in self._order()]
