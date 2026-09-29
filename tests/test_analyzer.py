import pytest

from sim.analyzer import (BALANCED, CPU_BOUND, IO_BOUND, MEMORY_PRESSURE, THRASHING,
                          UNDERUTILIZED, diagnose)
from sim.metrics import compute_metrics, jain_index
from sim.process import Process
from sim.runner import run_simulation, run_whatif
from workloads import load_workload


@pytest.mark.parametrize("name,expected", [
    ("cpu_heavy.json", CPU_BOUND),
    ("io_heavy.json", IO_BOUND),
    ("memory_hog.json", THRASHING),
])
def test_workload_diagnosis(name, expected):
    assert run_simulation(name).diagnosis.label == expected


def test_mixed_has_no_extreme_label():
    assert run_simulation("mixed.json").diagnosis.label in (BALANCED, MEMORY_PRESSURE)


def test_underutilized_single_light_process():
    out = run_simulation(load_workload("io_heavy.json").__class__(
        "tiny", "", [Process(1, 0, 1, [("cpu", 2)], pages=0), Process(2, 40, 1, [("cpu", 2)])],
        {"ram_frames": 8}))
    assert out.diagnosis.label == UNDERUTILIZED


def test_whatif_thrashing_more_ram_improves():
    w = run_whatif("memory_hog.json")
    assert w is not None and w["changes"] == {"ram_frames": 16}
    d = w["delta"]
    assert d["cpu_util"]["better"] and d["page_fault_rate"]["better"]
    assert d["total_ticks"]["better"] and d["thrashing_fraction"]["better"]
    assert w["b"].diagnosis.label != THRASHING


def test_whatif_none_when_no_suggestion():
    assert run_whatif("io_heavy.json") is None


def test_metrics_basic_ranges():
    m = compute_metrics(run_simulation("cpu_heavy.json").result)
    for key in ("cpu_util", "disk_util", "ram_util", "swap_share", "thrashing_fraction"):
        assert 0.0 <= m[key] <= 1.0
    assert m["finished_processes"] == 6 and m["completed"]


def test_jain_index():
    assert jain_index([5, 5, 5]) == pytest.approx(1.0)
    assert jain_index([1, 0, 0, 0]) == pytest.approx(0.25)
    assert jain_index([]) == 1.0
