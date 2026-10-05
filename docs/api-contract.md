# API Contract

## Models

### SimConfig
```json
{
  "workload": "mixed",
  "scheduler": "rr",
  "quantum": 4,
  "ram_frames": 16,
  "replacement": "lru",
  "disk_service_time": 5,
  "aging_interval": 0,
  "seed": 42,
  "max_ticks": 5000
}
```

### Snapshot
```json
{
  "t": 42,
  "running": 3,
  "ready_queue": [1, 5, 2],
  "io_queue": [4],
  "frames": [1, 1, 3, 3, 3, null, 5, 2],
  "events": ["page_fault:3", "io_done:4"],
  "util": { "cpu": 0.85, "ram": 0.75, "io": 0.6 }
}
```

## Endpoints
- `GET /api/workloads`: returns string array
- `POST /api/simulate`: takes SimConfig, returns SimResult
- `POST /api/compare`: takes config_a, config_b, returns CompareResult
