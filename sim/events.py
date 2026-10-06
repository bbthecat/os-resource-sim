"""รูปแบบ string ของ event ("ชื่อ:pid") ให้ทุกส่วนใช้ format เดียวกัน"""
from __future__ import annotations

THRASHING_START = "thrashing_start"
THRASHING_END = "thrashing_end"


def arrive(pid: int) -> str:
    return f"arrive:{pid}"


def page_fault(pid: int) -> str:
    return f"page_fault:{pid}"


def page_loaded(pid: int) -> str:
    return f"page_loaded:{pid}"


def mem_access(pid: int, page: int, hit: bool) -> str:
    return f"mem_access:{pid}:{page}:{int(hit)}"


def evict(pid: int) -> str:
    """pid = เจ้าของ page ที่ถูกเตะออกจาก RAM"""
    return f"evict:{pid}"


def io_done(pid: int) -> str:
    return f"io_done:{pid}"


def preempt(pid: int) -> str:
    return f"preempt:{pid}"


def finish(pid: int) -> str:
    return f"finish:{pid}"


def parse(event: str) -> tuple[str, int | None]:
    """'page_fault:3' -> ('page_fault', 3), 'thrashing_start' -> ('thrashing_start', None)"""
    name, _, arg = event.partition(":")
    return name, (int(arg) if arg else None)
