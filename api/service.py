from pathlib import Path
from sim.config import SimConfig
from sim.runner import run_simulation, run_compare
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
    # For compare, usually we compare the same workload, but we load based on config
    
    comp = run_compare(workload_name_a, sim_config_a, sim_config_b)
    
    return {
        "result_a": {
            "config": comp["a"].result.config.to_dict(),
            "snapshots": comp["a"].result.snapshots,
            "metrics": comp["a"].metrics,
            "diagnosis": comp["a"].diagnosis.to_dict() if comp["a"].diagnosis else None
        },
        "result_b": {
            "config": comp["b"].result.config.to_dict(),
            "snapshots": comp["b"].result.snapshots,
            "metrics": comp["b"].metrics,
            "diagnosis": comp["b"].diagnosis.to_dict() if comp["b"].diagnosis else None
        },
        "delta_metrics": comp["delta"]
    }
