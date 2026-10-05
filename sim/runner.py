"""ตัวช่วยรัน: run_simulation / run_compare / run_whatif + text Gantt
(api/service.py ในอนาคตเรียกไฟล์นี้ได้เลย)"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .analyzer import Diagnosis, diagnose
from .config import SimConfig
from .engine import SimResult, Simulation
from .metrics import compare_metrics, compute_metrics


@dataclass
class RunOutput:
    result: SimResult
    metrics: dict
    diagnosis: Diagnosis

    def to_dict(self) -> dict:
        return {"result": self.result.to_dict(), "metrics": self.metrics,
                "diagnosis": self.diagnosis.to_dict()}


def _resolve(workload):
    if isinstance(workload, (str, Path)):
        from workloads import load_workload
        return load_workload(workload)
    return workload


def run_simulation(workload, config: SimConfig | None = None) -> RunOutput:
    """workload = Workload หรือ path ของ .json; ไม่ส่ง config = ใช้ค่าแนะนำในไฟล์"""
    wl = _resolve(workload)
    cfg = config if config is not None else wl.default_config()
    result = Simulation(wl.processes, cfg).run()
    metrics = compute_metrics(result)
    return RunOutput(result, metrics, diagnose(metrics, cfg))


def run_compare(workload, config_a: SimConfig, config_b: SimConfig) -> dict:
    """รัน workload เดียวกัน 2 config แล้วเทียบ (ลำดับ page ของแต่ละ process เท่ากัน)"""
    wl = _resolve(workload)
    a = run_simulation(wl, config_a)
    b = run_simulation(wl, config_b)
    return {"a": a, "b": b, "delta": compare_metrics(a.metrics, b.metrics)}


def run_whatif(workload, config: SimConfig | None = None) -> dict | None:
    """วินิจฉัยก่อน แล้วลองแก้ตาม suggested_config เทียบก่อน/หลัง
    คืน None ถ้าไม่มีค่าที่แนะนำให้ลอง"""
    wl = _resolve(workload)
    cfg = config if config is not None else wl.default_config()
    before = run_simulation(wl, cfg)
    changes = before.diagnosis.suggested_config
    if not changes:
        return None
    after = run_simulation(wl, cfg.with_changes(**changes))
    return {"changes": changes, "a": before, "b": after,
            "delta": compare_metrics(before.metrics, after.metrics)}


# ------------------------------------------------------------------ Gantt
_SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyz"


def _sym(pid) -> str:
    return "." if pid is None else _SYMBOLS[pid % len(_SYMBOLS)]


def gantt_segments(snapshots: list) -> list:
    """[(pid|None, start, end)] ช่วงต่อเนื่องของแต่ละ process (ให้ UI วาด Gantt)"""
    segs = []
    for s in snapshots:
        pid, t = s["running"], s["t"]
        if segs and segs[-1][0] == pid and segs[-1][2] == t:
            segs[-1] = (pid, segs[-1][1], t + 1)
        else:
            segs.append((pid, t, t + 1))
    return segs


def gantt_text(snapshots: list, width: int = 60) -> str:
    """Gantt ตัวอักษร: 1 ตัว = 1 tick, '.' = CPU ว่าง"""
    line = "".join(_sym(s["running"]) for s in snapshots)
    rows = []
    for i in range(0, len(line), width):
        rows.append(f"{i:>5} |{line[i:i + width]}")
    return "\n".join(rows)
