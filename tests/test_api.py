import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_get_workloads():
    response = client.get("/api/workloads")
    assert response.status_code == 200
    workloads = response.json()
    assert isinstance(workloads, list)
    assert len(workloads) > 0
    assert "mixed" in workloads


def test_simulate_endpoint():
    payload = {
        "workload": "mixed",
        "scheduler": "rr",
        "quantum": 4,
        "ram_frames": 16,
        "replacement": "lru",
        "disk_service_time": 5,
        "aging_interval": 0,
        "seed": 42,
        "max_ticks": 1000
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "snapshots" in data
    assert "metrics" in data
    assert len(data["snapshots"]) > 0


def test_compare_endpoint():
    payload = {
        "config_a": {
            "workload": "mixed",
            "scheduler": "fcfs",
            "quantum": 4,
            "ram_frames": 8,
            "replacement": "fifo"
        },
        "config_b": {
            "workload": "mixed",
            "scheduler": "sjf",
            "quantum": 4,
            "ram_frames": 16,
            "replacement": "clock"
        }
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "result_a" in data
    assert "result_b" in data
    assert "delta_metrics" in data
