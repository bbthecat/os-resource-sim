import pytest
from sim.memory.replacement import FIFOPolicy, LRUPolicy, ClockPolicy, make_policy
from sim.memory.manager import MemoryManager
from sim.memory.thrashing import ThrashingDetector


def test_fifo_policy():
    fifo = FIFOPolicy()
    fifo.on_load(0)
    fifo.on_load(1)
    fifo.on_load(2)

    assert fifo.choose_victim() == 0
    fifo.on_free(0)
    assert fifo.choose_victim() == 1


def test_lru_policy():
    lru = LRUPolicy()
    lru.on_load(0)
    lru.on_load(1)
    lru.on_load(2)

    # Access 0 -> makes 1 the least recently used
    lru.on_access(0)
    assert lru.choose_victim() == 1

    # Access 1 -> makes 2 the least recently used
    lru.on_access(1)
    assert lru.choose_victim() == 2


def test_clock_policy():
    clock = ClockPolicy()
    clock.on_load(0)
    clock.on_load(1)
    clock.on_load(2)

    # All bits are 1 initially
    # First choose_victim:
    # Frame 0 (bit 1 -> 0)
    # Frame 1 (bit 1 -> 0)
    # Frame 2 (bit 1 -> 0)
    # Frame 0 (bit is now 0 -> chosen as victim!)
    victim = clock.choose_victim()
    assert victim == 0

    clock.on_free(0)
    # Access 2 so bit 2 becomes 1
    clock.on_access(2)
    # Frame 1 has bit 0, so next victim should be 1
    assert clock.choose_victim() == 1


def test_memory_manager_allocate_and_evict():
    mm = MemoryManager(num_frames=2, policy="fifo")
    
    # PID 1 requests page 0 -> not present (fault)
    hit = mm.access(pid=1, page=0)
    assert hit is False

    # Load into frame
    victim = mm.load(pid=1, page=0)
    assert victim is None

    # Access again -> hit
    hit2 = mm.access(pid=1, page=0)
    assert hit2 is True

    # Load 2nd page
    mm.load(pid=1, page=1)

    # Load 3rd page -> should evict page (1, 0)
    evicted = mm.load(pid=2, page=0)
    assert evicted == (1, 0)


def test_thrashing_detector():
    td = ThrashingDetector(window=10, cpu_util_max=0.6, swap_util_min=0.6)
    # Record low CPU and high paging I/O
    for _ in range(10):
        td.record(cpu_busy=False, swap_busy=True)
    assert td.check() is True

    # Record healthy CPU execution
    for _ in range(10):
        td.record(cpu_busy=True, swap_busy=False)
    assert td.check() is False
