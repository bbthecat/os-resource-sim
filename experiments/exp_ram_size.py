import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation

def main():
    ram_sizes = [8, 16, 32, 64]
    workload_name = "memory_hog"
    results = []

    print(f"Running RAM Size Experiment on '{workload_name}'...")
    for ram in ram_sizes:
        config = SimConfig(scheduler="rr", ram_frames=ram, replacement="lru")
        output = run_simulation(workload_name, config)
        
        res = {
            "ram_frames": ram,
            "page_fault_rate": output.metrics["page_fault_rate"],
            "thrashing_fraction": output.metrics["thrashing_fraction"],
            "cpu_util": output.metrics["cpu_util"]
        }
        results.append(res)
        print(f"RAM={ram:2d} -> Fault Rate: {res['page_fault_rate']:.2%}, Thrashing: {res['thrashing_fraction']:.2%}, CPU: {res['cpu_util']:.2%}")
        
    out_file = Path("experiments/results/ram_size.json")
    out_file.write_text(json.dumps(results, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
