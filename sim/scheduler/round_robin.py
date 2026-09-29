from __future__ import annotations

from collections import deque

from .base import BaseScheduler


class RoundRobinScheduler(BaseScheduler):
    """Round Robin: หมด quantum แล้ว preempt กลับท้ายคิว"""
    name = "rr"

    def __init__(self, config) -> None:
        super().__init__(config)
        self._q: deque = deque()
        self._used = 0

    def add(self, p) -> None:
        self._q.append(p)

    def pick(self):
        if not self._q:
            return None
        self._used = 0
        return self._q.popleft()

    def on_tick(self, running) -> bool:
        self._used += 1
        return self._used >= self.config.quantum

    def queue(self) -> list:
        return [p.pid for p in self._q]
