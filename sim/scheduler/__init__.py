from .base import BaseScheduler
from .fcfs import FCFSScheduler
from .priority import PriorityScheduler
from .round_robin import RoundRobinScheduler

_REGISTRY = {
    "fcfs": FCFSScheduler,
    "rr": RoundRobinScheduler,
    "priority": PriorityScheduler,
}


def make_scheduler(config) -> BaseScheduler:
    return _REGISTRY[config.scheduler](config)


__all__ = ["BaseScheduler", "FCFSScheduler", "RoundRobinScheduler",
           "PriorityScheduler", "make_scheduler"]
