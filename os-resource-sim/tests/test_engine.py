from sim.config import SimConfig
from sim.engine import Simulation
from sim.process import Process, State
from workloads import load_workload


def run(procs, **cfg):
    return Simulation(procs, SimConfig(**cfg)).run()


def test_io_burst_timeline():
    # cpu2 (t0-1) -> io3 (disk t2-4) -> cpu2 (t4-5) -> จบที่ 6
    r = run([Process(1, 0, 1, [("cpu", 2), ("io", 3), ("cpu", 2)])])
    p = r.processes[0]
    assert p.finish_time == 6 and p.turnaround == 6
    assert r.disk_busy_ticks == {"io": 3, "page": 0}
    assert [s["cpu_busy"] for s in r.snapshots] == [True, True, False, False, True, True]


def test_page_fault_chain():
    # fault ที่ t0 -> disk 5 tick (t1-5) -> รัน t5-7 -> จบที่ 8
    r = run([Process(1, 0, 1, [("cpu", 3)], pages=1)], ram_frames=1, disk_service_time=5)
    p = r.processes[0]
    assert p.page_faults == 1 and p.finish_time == 8
    assert r.disk_busy_ticks["page"] == 5
    first = r.snapshots[0]
    assert "page_fault:1" in first["events"] and first["waiting_mem"] == [1]
    assert not first["cpu_busy"]                      # fault ไม่กิน CPU


def test_eviction_event_when_ram_full():
    procs = [Process(1, 0, 1, [("cpu", 30)], pages=6), Process(2, 0, 1, [("cpu", 30)], pages=6)]
    r = run(procs, ram_frames=2, scheduler="rr", quantum=3)
    all_events = [e for s in r.snapshots for e in s["events"]]
    assert any(e.startswith("evict:") for e in all_events)


def test_memory_released_when_done():
    r = run([Process(1, 0, 1, [("cpu", 3)], pages=2)], ram_frames=4)
    assert r.completed
    assert all(f is None for f in r.snapshots[-1]["frames"]) or r.snapshots[-1]["frames"].count(1) == 0


def test_first_burst_io_and_consecutive_cpu():
    r = run([Process(1, 2, 1, [("io", 2), ("cpu", 1), ("cpu", 1)])])
    p = r.processes[0]
    assert p.finish_time is not None and p.state is State.DONE


def test_deterministic_and_workload_not_mutated():
    wl = load_workload("mixed.json")
    cfg = wl.default_config()
    r1 = Simulation(wl.processes, cfg).run()
    r2 = Simulation(wl.processes, cfg).run()
    assert r1.snapshots == r2.snapshots
    assert all(p.state is State.NEW for p in wl.processes)


def test_page_stream_independent_of_ram_size():
    """ทำ What-if แฟร์: ลำดับ page ของ process ต้องไม่ขึ้นกับขนาด RAM"""
    wl = load_workload("memory_hog.json")
    small = Simulation(wl.processes, wl.default_config()).run()
    big = Simulation(wl.processes, wl.default_config().with_changes(ram_frames=200)).run()
    assert {p.pid: p.mem_accesses - p.page_faults for p in small.processes} == \
           {p.pid: p.mem_accesses - p.page_faults for p in big.processes}


def test_max_ticks_guard():
    r = run([Process(1, 0, 1, [("cpu", 100)])], max_ticks=10)
    assert not r.completed and r.ticks == 10
