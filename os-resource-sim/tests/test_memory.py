from sim.memory.manager import MemoryManager, count_faults
from sim.memory.thrashing import ThrashingDetector

REFS = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]


def test_textbook_reference_string():
    assert count_faults(REFS, 3, "fifo") == 15
    assert count_faults(REFS, 3, "lru") == 12


def test_belady_anomaly_fifo():
    assert count_faults(BELADY, 3, "fifo") == 9
    assert count_faults(BELADY, 4, "fifo") == 10      # เพิ่ม frame แล้ว fault มากขึ้น


def test_lru_has_no_belady_anomaly():
    assert count_faults(BELADY, 4, "lru") <= count_faults(BELADY, 3, "lru")


def test_load_evict_and_release():
    mm = MemoryManager(2, "fifo")
    assert mm.load(1, 0) is None and mm.load(1, 1) is None
    assert mm.access(1, 0) and not mm.access(2, 0)
    assert mm.load(2, 0) == (1, 0)                    # FIFO เตะตัวที่เข้าก่อน
    assert mm.frame_owners() == [2, 1]
    mm.release(1)
    assert mm.frame_owners() == [2, None] and mm.used_frames() == 1


def test_thrashing_detector():
    d = ThrashingDetector(window=10)
    for _ in range(10):
        d.record(cpu_busy=False, swap_busy=True)
    assert d.check()
    for _ in range(10):
        d.record(cpu_busy=True, swap_busy=False)
    assert not d.check()
