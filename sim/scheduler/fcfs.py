from __future__ import annotations

from collections import deque

from .base import BaseScheduler


class FCFSScheduler(BaseScheduler):
    """First-Come First-Served (non-preemptive)"""
    name = "fcfs"

    def __init__(self, config) -> None:
        super().__init__(config)
        self._q: deque = deque()

    def add(self, p) -> None:
        self._q.append(p)

    def pick(self):
        return self._q.popleft() if self._q else None

    def queue(self) -> list:
        return [p.pid for p in self._q]
