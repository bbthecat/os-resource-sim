import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation

def main():
    # Comparing FIFO vs LRU vs Clock on memory_hog
    workload_name = "memory_hog"
    print(f"Running Replacement Experiment on '{workload_name}'...")
    
    policies = ["fifo", "lru", "clock"]
    results = []

    for pol in policies:
        config = SimConfig(scheduler="rr", ram_frames=16, replacement=pol)
        out = run_simulation(workload_name, config)
        res = {
            "policy": pol.upper(),
            "page_faults": out.metrics["total_page_faults"],
            "page_fault_rate": out.metrics["page_fault_rate"],
            "thrashing_fraction": out.metrics["thrashing_fraction"],
            "turnaround": out.metrics["avg_turnaround"]
        }
        results.append(res)
        print(f"Policy: {pol.upper():5s} -> Faults: {res['page_faults']}, Fault Rate: {res['page_fault_rate']:.2%}, Thrashing: {res['thrashing_fraction']:.2%}")
    
    out_file = Path("experiments/results/replacement.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(results, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
