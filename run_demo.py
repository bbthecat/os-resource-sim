"""รันตัวอย่าง: python run_demo.py [workload.json] [--json out.json] [--whatif]

ตัวอย่าง:
  python run_demo.py                          # รันทุก workload
  python run_demo.py memory_hog.json --whatif
  python run_demo.py mixed.json --json out.json
"""
import argparse
import json

from sim.runner import gantt_text, run_simulation, run_whatif
from workloads import list_workloads


def show(name: str, out) -> None:
    m, d = out.metrics, out.diagnosis
    print(f"\n=== {name} | scheduler={out.result.config.scheduler} "
          f"ram={out.result.config.ram_frames} ===")
    print(f"ticks={m['total_ticks']}  cpu={m['cpu_util']:.0%}  disk={m['disk_util']:.0%}  "
          f"fault_rate={m['page_fault_rate']:.0%}  avg_wait={m['avg_waiting']:.1f}  "
          f"avg_turnaround={m['avg_turnaround']:.1f}  thrashing={m['thrashing_fraction']:.0%}")
    print(f"วินิจฉัย: [{d.label}] {d.title}")
    print(f"  -> {d.recommendation}")
    for f in d.findings:
        print(f"  * [{f.label}] {f.title}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("workload", nargs="?")
    ap.add_argument("--json", help="เขียนผล (snapshot ทั้งหมด) ลงไฟล์ JSON")
    ap.add_argument("--whatif", action="store_true", help="ลองแก้ตามคำแนะนำแล้วเทียบก่อน/หลัง")
    ap.add_argument("--gantt", action="store_true", help="แสดง Gantt ตัวอักษร")
    args = ap.parse_args()

    names = [args.workload] if args.workload else list_workloads()
    for name in names:
        out = run_simulation(name)
        show(name, out)
        if args.gantt:
            print(gantt_text(out.result.snapshots))
        if args.json:
            with open(args.json, "w", encoding="utf-8") as f:
                json.dump(out.to_dict(), f, ensure_ascii=False)
            print(f"เขียน {args.json}")
        if args.whatif:
            w = run_whatif(name)
            if w is None:
                print("  What-if: ไม่มีค่า config ที่แนะนำให้ลอง")
            else:
                print(f"  What-if: ปรับ {w['changes']}")
                for key in ("total_ticks", "cpu_util", "page_fault_rate", "avg_turnaround"):
                    x = w["delta"][key]
                    print(f"    {key:16} {x['a']:.3f} -> {x['b']:.3f}  "
                          f"{'ดีขึ้น' if x['better'] else 'แย่ลง' if x['better'] is False else 'เท่าเดิม'}")


if __name__ == "__main__":
    main()
