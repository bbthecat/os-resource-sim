"""คำนวณ metrics จากผลการจำลอง (SimResult)"""
from __future__ import annotations

LOWER_IS_BETTER = {
    "avg_waiting", "avg_turnaround", "avg_response", "page_fault_rate",
    "total_page_faults", "total_ticks", "avg_ready_queue", "context_switches",
    "thrashing_fraction",
}


def jain_index(values) -> float:
    """Jain's Fairness Index: 1.0 = เท่ากันหมด, 1/n = ไม่เป็นธรรมที่สุด"""
    xs = [float(v) for v in values]
    if not xs:
        return 1.0
    sq = sum(x * x for x in xs)
    if sq == 0:
        return 1.0
    return (sum(xs) ** 2) / (len(xs) * sq)


def _mean(xs) -> float:
    xs = list(xs)
    return sum(xs) / len(xs) if xs else 0.0


def compute_metrics(result) -> dict:
    snaps = result.snapshots
    n = len(snaps) or 1
    frames = result.config.ram_frames

    cpu_util = sum(1 for s in snaps if s["cpu_busy"]) / n
    disk_util = sum(1 for s in snaps if s["disk_busy"]) / n
    ram_util = _mean(sum(1 for f in s["frames"] if f is not None) / frames for s in snaps)
    avg_ready = _mean(len(s["ready"]) for s in snaps)
    thrashing_fraction = sum(1 for s in snaps if s["thrashing"]) / n

    procs = result.processes
    done = [p for p in procs if p.finish_time is not None]
    slowdowns = [p.turnaround / (p.total_cpu + p.total_io) for p in done]

    disk_ticks = result.disk_busy_ticks
    disk_total = disk_ticks.get("io", 0) + disk_ticks.get("page", 0)

    return {
        "total_ticks": result.ticks,
        "completed": result.completed,
        "finished_processes": len(done),
        "cpu_util": cpu_util,
        "ram_util": ram_util,
        "disk_util": disk_util,
        "swap_share": disk_ticks.get("page", 0) / disk_total if disk_total else 0.0,
        "avg_ready_queue": avg_ready,
        "avg_waiting": _mean(p.wait_time for p in done),
        "avg_turnaround": _mean(p.turnaround for p in done),
        "avg_response": _mean(p.response for p in done if p.response is not None),
        "throughput": len(done) / n,
        "total_page_faults": result.page_faults,
        "page_fault_rate": result.page_faults / result.mem_accesses if result.mem_accesses else 0.0,
        "thrashing_fraction": thrashing_fraction,
        "context_switches": result.context_switches,
        "fairness": jain_index(slowdowns),
        "per_process": [p.to_dict() for p in procs],
    }


def compare_metrics(a: dict, b: dict) -> dict:
    """เทียบ metrics 2 ชุด (What-if): คืน {key: {a, b, delta, pct, better}}"""
    out = {}
    for key, va in a.items():
        vb = b.get(key)
        if key == "per_process" or isinstance(va, bool) or not isinstance(va, (int, float)):
            continue
        delta = vb - va
        pct = (delta / va * 100.0) if va else None
        if delta == 0:
            better = None
        elif key in LOWER_IS_BETTER:
            better = delta < 0
        else:
            better = delta > 0
        out[key] = {"a": va, "b": vb, "delta": delta, "pct": pct, "better": better}
    return out
