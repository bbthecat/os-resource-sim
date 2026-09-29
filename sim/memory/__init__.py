from .manager import MemoryManager, count_faults
from .replacement import FIFOPolicy, LRUPolicy, ReplacementPolicy, make_policy
from .thrashing import ThrashingDetector

__all__ = ["MemoryManager", "count_faults", "FIFOPolicy", "LRUPolicy",
           "ReplacementPolicy", "make_policy", "ThrashingDetector"]
