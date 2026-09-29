"""เทียบ scheduler กับตัวอย่างในตำรา (workload ไม่ใช้ memory/IO: pages=0)"""
import pytest

from sim.config import SimConfig
from sim.engine import Simulation
from sim.process import Process
from workloads import load_workload


def run(procs, **cfg):
    return Simulation(procs, SimConfig(**cfg)).run()


def waits(result):
    return {p.pid: p.wait_time for p in result.processes}


def test_fcfs_textbook():
    wl = load_workload("textbook_examples.json")
    r = run(wl.processes, scheduler="fcfs")
    assert waits(r) == {1: 0, 2: 24, 3: 27}          # เฉลี่ย 17
    assert r.ticks == 30


def test_rr_textbook_quantum4():
    wl = load_workload("textbook_examples.json")
    r = run(wl.processes, scheduler="rr", quantum=4)
    assert waits(r) == {1: 6, 2: 4, 3: 7}            # เฉลี่ย 5.67
    assert all(p.finish_time is not None for p in r.processes)


def test_rr_gantt_order():
    wl = load_workload("textbook_examples.json")
    r = run(wl.processes, scheduler="rr", quantum=4)
    order = [s["running"] for s in r.snapshots]
    assert order[:4] == [1] * 4 and order[4:7] == [2] * 3 and order[7:10] == [3] * 3


def test_priority_preemptive_lower_number_first():
    procs = [
        Process(1, 0, 3, [("cpu", 6)]),
        Process(2, 2, 1, [("cpu", 3)]),       # priority สูงกว่า มาทีหลัง -> แทรก
    ]
    r = run(procs, scheduler="priority")
    fin = {p.pid: p.finish_time for p in r.processes}
    assert fin[2] == 5 and fin[1] == 9


def test_priority_aging_prevents_starvation():
    # P1 priority ต่ำ ถูก P2..P5 ที่ priority สูงกลบ; aging ช่วยให้ได้รันเร็วขึ้น
    def make():
        return [Process(1, 0, 5, [("cpu", 3)])] + [
            Process(i, 0, 1, [("cpu", 10)]) for i in range(2, 6)
        ]
    no_aging = run(make(), scheduler="priority", aging_interval=0)
    aging = run(make(), scheduler="priority", aging_interval=5)
    f0 = {p.pid: p.finish_time for p in no_aging.processes}
    f1 = {p.pid: p.finish_time for p in aging.processes}
    assert f1[1] < f0[1]


def test_context_switch_and_response_time():
    wl = load_workload("textbook_examples.json")
    r = run(wl.processes, scheduler="rr", quantum=4)
    assert r.context_switches > 0
    resp = {p.pid: p.response for p in r.processes}
    assert resp == {1: 0, 2: 4, 3: 7}


def test_invalid_config():
    with pytest.raises(ValueError):
        SimConfig(scheduler="sjf")
    with pytest.raises(ValueError):
        SimConfig(ram_frames=0)
