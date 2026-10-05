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


class ClockPolicy(ReplacementPolicy):
    """Clock / Second Chance: วนตรวจ reference bit หากเป็น 0 ให้เลือกเป็นเหยื่อ หากเป็น 1 ให้โอกาสที่สองเปลี่ยนเป็น 0 แล้วเดินเข็มต่อ"""
    name = "clock"

    def __init__(self) -> None:
        self._frames: list[int] = []
        self._bits: dict[int, int] = {}
        self._hand: int = 0

    def on_load(self, idx: int) -> None:
        if idx not in self._frames:
            self._frames.append(idx)
        self._bits[idx] = 1

    def on_access(self, idx: int) -> None:
        self._bits[idx] = 1

    def on_free(self, idx: int) -> None:
        if idx in self._frames:
            pos = self._frames.index(idx)
            self._frames.remove(idx)
            if self._frames and self._hand >= len(self._frames):
                self._hand = 0
        self._bits.pop(idx, None)

    def choose_victim(self) -> int:
        if not self._frames:
            raise RuntimeError("no frames available for clock victim selection")
        n = len(self._frames)
        for _ in range(n * 2 + 1):
            if self._hand >= len(self._frames):
                self._hand = 0
            candidate = self._frames[self._hand]
            if self._bits.get(candidate, 0) == 0:
                victim = candidate
                self._hand = (self._hand + 1) % len(self._frames)
                return victim
            else:
                self._bits[candidate] = 0
                self._hand = (self._hand + 1) % len(self._frames)
        return self._frames[0]


_POLICIES = {"fifo": FIFOPolicy, "lru": LRUPolicy, "clock": ClockPolicy}


def make_policy(name: str) -> ReplacementPolicy:
    try:
        return _POLICIES[name]()
    except KeyError:
        raise ValueError(f"unknown replacement policy: {name!r}") from None

