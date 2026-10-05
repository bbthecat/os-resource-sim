import pytest
from sim.config import SimConfig
from sim.engine import Simulation
from sim.process import Process


def test_engine_single_process():
    p = Process(pid=1, arrival=0, priority=1, bursts=[("cpu", 3)])
    cfg = SimConfig(scheduler="fcfs", ram_frames=4)
    sim = Simulation([p], cfg)
    result = sim.run()

    assert result.completed is True
    assert result.ticks == 3
    assert len(result.snapshots) == 3
    assert result.processes[0].finish_time == 3
    assert result.processes[0].wait_time == 0


def test_engine_cpu_and_io_bursts():
    p1 = Process(pid=1, arrival=0, priority=1, bursts=[("cpu", 2), ("io", 2), ("cpu", 1)])
    cfg = SimConfig(scheduler="fcfs", ram_frames=4)
    sim = Simulation([p1], cfg)
    result = sim.run()

    assert result.completed is True
    assert result.ticks == 4
    assert result.processes[0].finish_time == 4


def test_engine_snapshots_format():
    p = Process(pid=1, arrival=0, priority=1, bursts=[("cpu", 2)])
    cfg = SimConfig(scheduler="rr", quantum=1, ram_frames=2)
    sim = Simulation([p], cfg)
    result = sim.run()

    snap = result.snapshots[0]
    expected_keys = {"t", "running", "ready", "waiting_io", "waiting_mem", "frames", "events", "cpu_busy"}
    assert expected_keys.issubset(snap.keys())
    assert snap["t"] == 0
    assert snap["running"] == 1
