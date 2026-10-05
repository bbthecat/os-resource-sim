import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation

def main():
    quantums = [1, 2, 4, 8, 16]
    workload_name = "cpu_heavy"  # Best for testing quantum
    results = []

    print(f"Running Quantum Experiment on '{workload_name}'...")
    for q in quantums:
        config = SimConfig(scheduler="rr", quantum=q)
        output = run_simulation(workload_name, config)
        
        # We care about waiting time, turnaround, and context switches
        res = {
            "quantum": q,
            "avg_waiting": output.metrics["avg_waiting"],
            "avg_turnaround": output.metrics["avg_turnaround"],
            "context_switches": output.metrics["context_switches"]
        }
        results.append(res)
        print(f"Q={q:2d} -> Wait: {res['avg_waiting']:.2f}, Turnaround: {res['avg_turnaround']:.2f}, CS: {res['context_switches']}")
        
    out_file = Path("experiments/results/quantum.json")
    out_file.write_text(json.dumps(results, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
