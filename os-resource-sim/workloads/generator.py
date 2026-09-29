"""สร้าง workload ด้วย random.seed (ผลซ้ำได้เสมอ)

ใช้: python -m workloads.generator     # เขียนไฟล์ .json ทั้งหมดลงโฟลเดอร์ workloads/
"""
from __future__ import annotations

import json
import random
from pathlib import Path

from . import WORKLOAD_DIR, Workload
from sim.process import Process

# cpu/io = (min, max) ความยาวของแต่ละ burst, cpu_bursts = จำนวน cpu burst ต่อ process
PROFILES = {
    "cpu_heavy": dict(cpu=(12, 25), io=(1, 2), cpu_bursts=(2, 3), pages=(2, 3), arrival_span=4),
    "io_heavy": dict(cpu=(1, 3), io=(6, 12), cpu_bursts=(4, 6), pages=(2, 3), arrival_span=4),
    "memory_hog": dict(cpu=(6, 12), io=(1, 2), cpu_bursts=(3, 4), pages=(8, 10), arrival_span=4),
}

DEFAULT_CONFIG = {
    "cpu_heavy": {"scheduler": "rr", "quantum": 4, "ram_frames": 32},
    "io_heavy": {"scheduler": "rr", "quantum": 4, "ram_frames": 32},
    "memory_hog": {"scheduler": "rr", "quantum": 4, "ram_frames": 8},
    "mixed": {"scheduler": "rr", "quantum": 4, "ram_frames": 16},
}

DESCRIPTIONS = {
    "cpu_heavy": "งานใช้ CPU เป็นหลัก RAM เพียงพอ -> คาดว่า CPU-bound",
    "io_heavy": "งานรอ disk นานและ CPU burst สั้น -> คาดว่า I/O-bound",
    "memory_hog": "working set รวมใหญ่กว่า RAM มาก -> คาดว่า thrashing",
    "mixed": "ผสมทั้ง 3 แบบ ใช้ทดสอบภาพรวม",
}


def _make_process(rng: random.Random, pid: int, profile: dict) -> Process:
    n_cpu = rng.randint(*profile["cpu_bursts"])
    bursts = []
    for i in range(n_cpu):
        bursts.append(("cpu", rng.randint(*profile["cpu"])))
        if i < n_cpu - 1:
            bursts.append(("io", rng.randint(*profile["io"])))
    return Process(
        pid=pid,
        arrival=rng.randint(0, profile["arrival_span"]),
        priority=rng.randint(1, 5),
        bursts=bursts,
        pages=rng.randint(*profile["pages"]),
    )


def generate(kind: str, n: int = 6, seed: int = 1) -> Workload:
    rng = random.Random(seed)
    if kind == "mixed":
        order = ["cpu_heavy", "io_heavy", "memory_hog"]
        procs = [_make_process(rng, i + 1, PROFILES[order[i % 3]]) for i in range(n)]
    elif kind in PROFILES:
        procs = [_make_process(rng, i + 1, PROFILES[kind]) for i in range(n)]
    else:
        raise ValueError(f"unknown kind {kind!r}; choose from {sorted(DEFAULT_CONFIG)}")
    return Workload(kind, DESCRIPTIONS[kind], procs, dict(DEFAULT_CONFIG[kind]))


def to_json_dict(w: Workload) -> dict:
    return {
        "name": w.name, "description": w.description, "config": w.config,
        "processes": [
            {"pid": p.pid, "arrival": p.arrival, "priority": p.priority,
             "bursts": [list(b) for b in p.bursts], "pages": p.pages}
            for p in w.processes
        ],
    }


def dump_workload(w: Workload) -> str:
    """JSON อ่านง่าย: 1 process ต่อ 1 บรรทัด"""
    d = to_json_dict(w)
    lines = ["{",
             f'  "name": {json.dumps(d["name"])},',
             f'  "description": {json.dumps(d["description"], ensure_ascii=False)},',
             f'  "config": {json.dumps(d["config"])},',
             '  "processes": [']
    rows = [f"    {json.dumps(p)}" for p in d["processes"]]
    lines.append(",\n".join(rows))
    lines += ["  ]", "}"]
    return "\n".join(lines) + "\n"


def write_all(directory=None, n: int = 6, seed: int = 1) -> list:
    directory = Path(directory) if directory else WORKLOAD_DIR
    written = []
    for kind in DEFAULT_CONFIG:
        path = directory / f"{kind}.json"
        path.write_text(dump_workload(generate(kind, n, seed)), encoding="utf-8")
        written.append(path.name)
    return written


if __name__ == "__main__":
    print("wrote:", ", ".join(write_all()))
