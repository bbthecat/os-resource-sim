from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SimConfigModel(BaseModel):
    workload: str = "mixed"
    scheduler: str = "rr"
    quantum: int = 4
    ram_frames: int = 16
    replacement: str = "lru"
    disk_service_time: int = 5
    aging_interval: int = 0
    seed: int = 42
    max_ticks: int = 5000

class SimResultModel(BaseModel):
    config: dict
    snapshots: List[dict]
    metrics: dict
    diagnosis: Optional[dict] = None

class CompareRequestModel(BaseModel):
    config_a: SimConfigModel
    config_b: SimConfigModel

class CompareResultModel(BaseModel):
    result_a: SimResultModel
    result_b: SimResultModel
    delta_metrics: dict
