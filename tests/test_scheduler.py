import pytest
from sim.config import SimConfig
from sim.process import Process
from sim.scheduler.fcfs import FCFSScheduler
from sim.scheduler.round_robin import RoundRobinScheduler
from sim.scheduler.priority import PriorityScheduler
from sim.scheduler.sjf import SJFScheduler


def make_proc(pid: int, bursts: list, priority: int = 1, arrival: int = 0) -> Process:
    return Process(pid=pid, arrival=arrival, priority=priority, bursts=bursts)


def test_fcfs_scheduler():
    cfg = SimConfig(scheduler="fcfs")
    sched = FCFSScheduler(cfg)
    p1 = make_proc(1, [("cpu", 5)])
    p2 = make_proc(2, [("cpu", 3)])

    sched.add(p1)
    sched.add(p2)

    assert sched.queue() == [1, 2]
    assert sched.pick().pid == 1
    assert sched.pick().pid == 2
    assert sched.pick() is None


def test_rr_scheduler_quantum():
    cfg = SimConfig(scheduler="rr", quantum=2)
    sched = RoundRobinScheduler(cfg)
    p1 = make_proc(1, [("cpu", 4)])
    p2 = make_proc(2, [("cpu", 2)])

    sched.add(p1)
    sched.add(p2)

    # First pick should be P1
    cur = sched.pick()
    assert cur.pid == 1
    # 1 tick, no preempt yet
    assert sched.on_tick(cur) is False
    # 2nd tick (reaches quantum 2), should preempt
    assert sched.on_tick(cur) is True

    # P1 put back to queue
    sched.add(cur)
    assert sched.queue() == [2, 1]
    # Next pick is P2
    next_p = sched.pick()
    assert next_p.pid == 2


def test_priority_preemption_and_aging():
    # priority 0 is higher than priority 2
    cfg = SimConfig(scheduler="priority", aging_interval=3)
    sched = PriorityScheduler(cfg)
    p_low = make_proc(1, [("cpu", 10)], priority=5)
    p_high = make_proc(2, [("cpu", 5)], priority=1)

    sched.add(p_low)
    running = sched.pick()
    assert running.pid == 1

    # Now high priority process arrives
    sched.add(p_high)
    assert sched.should_preempt(running) is True

    # Test aging mechanism
    p3 = make_proc(3, [("cpu", 5)], priority=5)
    sched2 = PriorityScheduler(SimConfig(scheduler="priority", aging_interval=2))
    sched2.add(p3)
    assert sched2._effective(p3) == 5
    sched2.age()
    assert sched2._effective(p3) == 5
    sched2.age()  # waited 2 ticks -> boost by 1
    assert sched2._effective(p3) == 4


def test_sjf_scheduler():
    cfg = SimConfig(scheduler="sjf")
    sched = SJFScheduler(cfg)
    p_long = make_proc(1, [("cpu", 10)])
    p_short = make_proc(2, [("cpu", 2)])
    p_mid = make_proc(3, [("cpu", 5)])

    sched.add(p_long)
    sched.add(p_short)
    sched.add(p_mid)

    assert sched.queue() == [2, 3, 1]
    assert sched.pick().pid == 2
    assert sched.pick().pid == 3
    assert sched.pick().pid == 1
