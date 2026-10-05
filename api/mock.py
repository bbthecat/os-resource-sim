def get_mock_workloads():
    return ["cpu_heavy", "io_heavy", "memory_hog", "mixed", "textbook_examples"]

def mock_simulate(config_model):
    config_dict = config_model.model_dump()
    return {
        "config": config_dict,
        "snapshots": [
            {
                "t": 0, "running": None, "ready": [], "waiting_io": [], "waiting_mem": [],
                "frames": [None] * config_dict.get("ram_frames", 16),
                "disk_busy": False, "disk_queue": [], "cpu_busy": False, "thrashing": False, "events": []
            }
        ],
        "metrics": {
            "total_ticks": 1,
            "completed": True,
            "finished_processes": 0,
            "cpu_util": 0.0,
            "ram_util": 0.0,
            "disk_util": 0.0,
            "swap_share": 0.0,
            "avg_ready_queue": 0.0,
            "avg_waiting": 0.0,
            "avg_turnaround": 0.0,
            "avg_response": 0.0,
            "throughput": 0.0,
            "total_page_faults": 0,
            "page_fault_rate": 0.0,
            "thrashing_fraction": 0.0,
            "context_switches": 0,
            "fairness": 1.0,
            "per_process": []
        },
        "diagnosis": {
            "label": "BALANCED", "title": "Mock", "evidence": {}, "recommendation": "mock", "suggested_config": {}, "findings": []
        }
    }
