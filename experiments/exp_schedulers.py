import json
from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation

def main():
    workload_name = "cpu_heavy"
    print(f"Running Scheduler Comparison Experiment on '{workload_name}'...")
    
    configs = [
        ("FCFS", SimConfig(scheduler="fcfs")),
        ("SJF", SimConfig(scheduler="sjf")),
        ("RR (q=2)", SimConfig(scheduler="rr", quantum=2)),
        ("RR (q=4)", SimConfig(scheduler="rr", quantum=4)),
        ("Priority", SimConfig(scheduler="priority")),
    ]
    
    results = []
    for label, cfg in configs:
        out = run_simulation(workload_name, cfg)
        res = {
            "scheduler": label,
            "avg_waiting": out.metrics["avg_waiting"],
            "avg_turnaround": out.metrics["avg_turnaround"],
            "avg_response": out.metrics["avg_response"],
            "context_switches": out.metrics["context_switches"]
        }
        results.append(res)
        print(f"[{label:10s}] -> Wait: {res['avg_waiting']:.2f}, Turnaround: {res['avg_turnaround']:.2f}, CS: {res['context_switches']}")
        
    out_file = Path("experiments/results/schedulers.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(results, indent=2))
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    main()
