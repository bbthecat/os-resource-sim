from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation, run_compare
from sim.metrics import compare_metrics
from workloads import list_workloads, load_workload

def get_workloads() -> list[str]:
    # list_workloads returns paths like 'cpu_heavy.json'. Let's strip the extension.
    wls = list_workloads()
    return [Path(w).stem for w in wls]

def simulate(config_model) -> dict:
    config_dict = config_model.model_dump()
    workload_name = config_dict.pop("workload", "mixed")
    
    # Check if workload ends with json, if not add it
    if not workload_name.endswith(".json"):
        workload_name += ".json"
        
    sim_config = SimConfig(**config_dict)
    
    output = run_simulation(workload_name, sim_config)
    
    return {
        "config": output.result.config.to_dict(),
        "snapshots": output.result.snapshots,
        "metrics": output.metrics,
        "diagnosis": output.diagnosis.to_dict() if output.diagnosis else None
    }

def compare(config_a_model, config_b_model) -> dict:
    config_dict_a = config_a_model.model_dump()
    workload_name_a = config_dict_a.pop("workload", "mixed")
    if not workload_name_a.endswith(".json"):
        workload_name_a += ".json"
    sim_config_a = SimConfig(**config_dict_a)

    config_dict_b = config_b_model.model_dump()
    workload_name_b = config_dict_b.pop("workload", "mixed")
    if not workload_name_b.endswith(".json"):
        workload_name_b += ".json"
    sim_config_b = SimConfig(**config_dict_b)
    
    out_a = run_simulation(workload_name_a, sim_config_a)
    out_b = run_simulation(workload_name_b, sim_config_b)
    delta = compare_metrics(out_a.metrics, out_b.metrics)
    
    return {
        "result_a": {
            "config": out_a.result.config.to_dict(),
            "snapshots": out_a.result.snapshots,
            "metrics": out_a.metrics,
            "diagnosis": out_a.diagnosis.to_dict() if out_a.diagnosis else None
        },
        "result_b": {
            "config": out_b.result.config.to_dict(),
            "snapshots": out_b.result.snapshots,
            "metrics": out_b.metrics,
            "diagnosis": out_b.diagnosis.to_dict() if out_b.diagnosis else None
        },
        "delta_metrics": delta
    }
