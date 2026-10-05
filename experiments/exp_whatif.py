import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_whatif

def main():
    workload_name = "mixed"
    
    print(f"Running What-If Experiment on '{workload_name}'...")
    
    config = SimConfig(scheduler="rr", quantum=4, ram_frames=8)
    comp = run_whatif(workload_name, config)
    
    if comp is None:
        print("No what-if changes were suggested by the analyzer.")
        return
        
    res = {
        "workload": workload_name,
        "suggested_changes": comp["changes"],
        "before_turnaround": comp["a"].metrics["avg_turnaround"],
        "after_turnaround": comp["b"].metrics["avg_turnaround"],
        "improvement_pct": comp["delta"]["avg_turnaround"]["pct"] if "avg_turnaround" in comp["delta"] else 0
    }
    
    print(f"Suggested changes: {res['suggested_changes']}")
    print(f"Turnaround: {res['before_turnaround']:.2f} -> {res['after_turnaround']:.2f} ({res['improvement_pct']:.2f}%)")
    
    out_file = Path("experiments/results/whatif.json")
    out_file.write_text(json.dumps(res, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
