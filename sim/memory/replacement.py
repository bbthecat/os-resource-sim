"""นโยบายเลือก frame ที่จะถูกเตะออก (page replacement)

interface: on_load(idx), on_access(idx), on_free(idx), choose_victim() -> idx
"""
from __future__ import annotations

from collections import deque


class ReplacementPolicy:
    name = "base"

    def on_load(self, idx: int) -> None: ...
    def on_access(self, idx: int) -> None: ...
    def on_free(self, idx: int) -> None: ...

    def choose_victim(self) -> int:
        raise NotImplementedError


class FIFOPolicy(ReplacementPolicy):
    """เตะ frame ที่โหลดมานานที่สุด"""
    name = "fifo"

    def __init__(self) -> None:
        self._order: deque = deque()

    def on_load(self, idx: int) -> None:
        if idx in self._order:
            self._order.remove(idx)
        self._order.append(idx)

    def on_free(self, idx: int) -> None:
        if idx in self._order:
            self._order.remove(idx)

    def choose_victim(self) -> int:
        return self._order[0]


class LRUPolicy(ReplacementPolicy):
    """เตะ frame ที่ไม่ถูกใช้มานานที่สุด"""
    name = "lru"

    def __init__(self) -> None:
        self._stamp: dict = {}
        self._clock = 0

    def _touch(self, idx: int) -> None:
        self._clock += 1
        self._stamp[idx] = self._clock

    def on_load(self, idx: int) -> None:
        self._touch(idx)

    def on_access(self, idx: int) -> None:
        self._touch(idx)

    def on_free(self, idx: int) -> None:
        self._stamp.pop(idx, None)

    def choose_victim(self) -> int:
        return min(self._stamp, key=self._stamp.get)


_POLICIES = {"fifo": FIFOPolicy, "lru": LRUPolicy}


def make_policy(name: str) -> ReplacementPolicy:
    try:
        return _POLICIES[name]()
    except KeyError:
        raise ValueError(f"unknown replacement policy: {name!r}") from None
