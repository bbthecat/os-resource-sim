import pytest
from sim.analyzer import diagnose, CPU_BOUND, IO_BOUND, THRASHING, BALANCED
from sim.config import SimConfig


def test_diagnose_cpu_bound():
    metrics = {
        "cpu_util": 0.95,
        "disk_util": 0.20,
        "swap_share": 0.10,
        "thrashing_fraction": 0.0,
        "page_fault_rate": 0.02,
        "avg_ready_queue": 2.5,
        "fairness": 0.90,
        "finished_processes": 3,
        "completed": True,
    }
    cfg = SimConfig(scheduler="fcfs")
    diag = diagnose(metrics, cfg)
    assert diag.label == CPU_BOUND
    assert "CPU" in diag.title


def test_diagnose_io_bound():
    metrics = {
        "cpu_util": 0.30,
        "disk_util": 0.90,
        "swap_share": 0.15,
        "thrashing_fraction": 0.0,
        "page_fault_rate": 0.01,
        "avg_ready_queue": 0.2,
        "fairness": 0.85,
        "finished_processes": 3,
        "completed": True,
    }
    diag = diagnose(metrics)
    assert diag.label == IO_BOUND


def test_diagnose_thrashing():
    metrics = {
        "cpu_util": 0.20,
        "disk_util": 0.95,
        "swap_share": 0.85,
        "thrashing_fraction": 0.40,
        "page_fault_rate": 0.50,
        "avg_ready_queue": 1.0,
        "fairness": 0.70,
        "finished_processes": 3,
        "completed": True,
    }
    cfg = SimConfig(ram_frames=8)
    diag = diagnose(metrics, cfg)
    assert diag.label == THRASHING
    assert "ram_frames" in diag.suggested_config
    assert diag.suggested_config["ram_frames"] > 8
