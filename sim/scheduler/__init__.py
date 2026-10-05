from .base import BaseScheduler
from .fcfs import FCFSScheduler
from .priority import PriorityScheduler
from .round_robin import RoundRobinScheduler
from .sjf import SJFScheduler

_REGISTRY = {
    "fcfs": FCFSScheduler,
    "rr": RoundRobinScheduler,
    "priority": PriorityScheduler,
    "sjf": SJFScheduler,
}


def make_scheduler(config) -> BaseScheduler:
    return _REGISTRY[config.scheduler](config)


__all__ = ["BaseScheduler", "FCFSScheduler", "RoundRobinScheduler",
           "PriorityScheduler", "SJFScheduler", "make_scheduler"]
