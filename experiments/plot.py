import json
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def plot_quantum():
    path = Path("experiments/results/quantum.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    plt.figure(figsize=(8, 5))
    plt.plot(df["quantum"], df["avg_waiting"], marker='o', label="Avg Waiting Time")
    plt.plot(df["quantum"], df["avg_turnaround"], marker='s', label="Avg Turnaround")
    plt.title("Impact of Quantum Size on Wait & Turnaround")
    plt.xlabel("Quantum")
    plt.ylabel("Ticks")
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    
    out_path = Path("experiments/results/plot_quantum.png")
    plt.savefig(out_path)
    print(f"Saved plot to {out_path}")

def plot_ram():
    path = Path("experiments/results/ram_size.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    plt.figure(figsize=(8, 5))
    plt.plot(df["ram_frames"], df["page_fault_rate"] * 100, marker='o', color='red', label="Page Fault Rate (%)")
    plt.plot(df["ram_frames"], df["thrashing_fraction"] * 100, marker='x', color='orange', label="Thrashing Fraction (%)")
    plt.title("Impact of RAM Size on Memory Performance")
    plt.xlabel("RAM Frames")
    plt.ylabel("Percentage (%)")
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    
    out_path = Path("experiments/results/plot_ram_size.png")
    plt.savefig(out_path)
    print(f"Saved plot to {out_path}")

def main():
    print("Generating plots...")
    plot_quantum()
    plot_ram()
    print("Done!")

if __name__ == "__main__":
    main()
