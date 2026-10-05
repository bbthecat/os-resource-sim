import json
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

def plot_quantum():
    path = Path("experiments/results/quantum.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    fig, ax1 = plt.subplots(figsize=(8, 5), dpi=300)
    
    ax1.plot(df["quantum"], df["avg_waiting"], marker='o', color='#3b82f6', label="Avg Waiting Time", linewidth=2)
    ax1.plot(df["quantum"], df["avg_turnaround"], marker='s', color='#10b981', label="Avg Turnaround Time", linewidth=2)
    ax1.set_xlabel("Time Quantum (ticks)", fontsize=11, fontweight='bold')
    ax1.set_ylabel("Time (ticks)", fontsize=11, fontweight='bold')
    ax1.set_title("Impact of Time Quantum on Scheduling Latency", fontsize=13, fontweight='bold', pad=12)
    
    ax2 = ax1.twinx()
    ax2.plot(df["quantum"], df["context_switches"], marker='^', color='#ef4444', linestyle='--', label="Context Switches", linewidth=1.5)
    ax2.set_ylabel("Context Switches (count)", color='#ef4444', fontsize=11, fontweight='bold')
    ax2.tick_params(axis='y', labelcolor='#ef4444')
    ax2.grid(False)
    
    # Combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', frameon=True)
    
    fig.tight_layout()
    out_path = Path("experiments/results/plot_quantum.png")
    fig.savefig(out_path)
    plt.close(fig)
    print(f"Saved plot to {out_path}")

def plot_ram():
    path = Path("experiments/results/ram_size.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
    ax.plot(df["ram_frames"], df["page_fault_rate"] * 100, marker='o', color='#ef4444', label="Page Fault Rate (%)", linewidth=2)
    ax.plot(df["ram_frames"], df["thrashing_fraction"] * 100, marker='x', color='#f59e0b', label="Thrashing Fraction (%)", linewidth=2)
    ax.plot(df["ram_frames"], df["cpu_util"] * 100, marker='s', color='#3b82f6', label="CPU Utilization (%)", linewidth=2)
    
    ax.set_title("RAM Allocation vs. Paging Faults & Thrashing", fontsize=13, fontweight='bold', pad=12)
    ax.set_xlabel("RAM Frames Allocation", fontsize=11, fontweight='bold')
    ax.set_ylabel("Percentage (%)", fontsize=11, fontweight='bold')
    ax.legend(frameon=True, loc='center right')
    ax.grid(True, linestyle='--', alpha=0.7)
    
    fig.tight_layout()
    out_path = Path("experiments/results/plot_ram_size.png")
    fig.savefig(out_path)
    plt.close(fig)
    print(f"Saved plot to {out_path}")

def plot_replacement():
    path = Path("experiments/results/replacement.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=300)
    colors = ['#f43f5e', '#6366f1', '#06b6d4']
    bars = ax.bar(df["policy"], df["page_faults"], color=colors, width=0.5, edgecolor='black', linewidth=0.5)
    
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{int(height)} faults',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 4), textcoords="offset points",
                    ha='center', va='bottom', fontweight='bold', fontsize=10)
        
    ax.set_title("Page Replacement Policy Comparison (Memory Hog)", fontsize=13, fontweight='bold', pad=12)
    ax.set_xlabel("Replacement Policy", fontsize=11, fontweight='bold')
    ax.set_ylabel("Total Page Faults", fontsize=11, fontweight='bold')
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    fig.tight_layout()
    out_path = Path("experiments/results/plot_replacement.png")
    fig.savefig(out_path)
    plt.close(fig)
    print(f"Saved plot to {out_path}")

def plot_schedulers():
    path = Path("experiments/results/schedulers.json")
    if not path.exists(): return
    
    data = json.loads(path.read_text())
    df = pd.DataFrame(data)
    
    x = range(len(df))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(9, 5), dpi=300)
    rects1 = ax.bar([i - width/2 for i in x], df["avg_waiting"], width, label="Avg Waiting Time", color='#3b82f6', edgecolor='black', linewidth=0.5)
    rects2 = ax.bar([i + width/2 for i in x], df["avg_turnaround"], width, label="Avg Turnaround Time", color='#8b5cf6', edgecolor='black', linewidth=0.5)
    
    ax.set_title("CPU Scheduling Algorithms Performance Comparison", fontsize=13, fontweight='bold', pad=12)
    ax.set_xlabel("Scheduler", fontsize=11, fontweight='bold')
    ax.set_ylabel("Ticks", fontsize=11, fontweight='bold')
    ax.set_xticks(list(x))
    ax.set_xticklabels(df["scheduler"], fontweight='bold')
    ax.legend(frameon=True)
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    fig.tight_layout()
    out_path = Path("experiments/results/plot_schedulers.png")
    fig.savefig(out_path)
    plt.close(fig)
    print(f"Saved plot to {out_path}")

def main():
    print("Generating comprehensive experiment plots...")
    plot_quantum()
    plot_ram()
    plot_replacement()
    plot_schedulers()
    print("All plots generated successfully in experiments/results/!")

if __name__ == "__main__":
    main()
