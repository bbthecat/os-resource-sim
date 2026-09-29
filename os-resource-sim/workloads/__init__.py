"""โหลด workload จากไฟล์ JSON

รูปแบบไฟล์:
{
  "name": "...", "description": "...",
  "config": {"ram_frames": 12, ...},          # (ไม่บังคับ) ค่า SimConfig ที่แนะนำ
  "processes": [
    {"pid": 1, "arrival": 0, "priority": 2,
     "bursts": [["cpu", 5], ["io", 3], ["cpu", 2]], "pages": 3}
  ]
}
pages = 0 หมายถึงไม่จำลอง memory ให้ process นั้น
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from sim.config import SimConfig
from sim.process import Process

WORKLOAD_DIR = Path(__file__).parent


@dataclass
class Workload:
    name: str
    description: str
    processes: list
    config: dict = field(default_factory=dict)

    def default_config(self) -> SimConfig:
        return SimConfig(**self.config)


def load_workload(path) -> Workload:
    path = Path(path)
    if not path.exists() and (WORKLOAD_DIR / path).exists():
        path = WORKLOAD_DIR / path
    data = json.loads(path.read_text(encoding="utf-8"))
    return Workload(
        name=data.get("name", path.stem),
        description=data.get("description", ""),
        processes=[Process.from_dict(d) for d in data["processes"]],
        config=data.get("config", {}),
    )


def list_workloads(directory=None) -> list:
    directory = Path(directory) if directory else WORKLOAD_DIR
    return sorted(p.name for p in directory.glob("*.json"))
