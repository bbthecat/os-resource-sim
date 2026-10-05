import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_compare

def main():
    # Comparing FIFO vs LRU to see differences
    workload_name = "memory_hog"
    
    print(f"Running Replacement Experiment on '{workload_name}'...")
    
    config_fifo = SimConfig(scheduler="rr", ram_frames=16, replacement="fifo")
    config_lru = SimConfig(scheduler="rr", ram_frames=16, replacement="lru")
    
    comp = run_compare(workload_name, config_fifo, config_lru)
    
    res = {
        "workload": workload_name,
        "fifo_faults": comp["a"].result.page_faults,
        "lru_faults": comp["b"].result.page_faults,
        "delta": comp["delta"]["total_page_faults"]["delta"] if "total_page_faults" in comp["delta"] else 0
    }
    
    print(f"FIFO Faults: {res['fifo_faults']}, LRU Faults: {res['lru_faults']} (Delta: {res['delta']})")
    
    out_file = Path("experiments/results/replacement.json")
    out_file.write_text(json.dumps(res, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
