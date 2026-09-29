"""Bottleneck Analyzer: วินิจฉัยว่าระบบช้าเพราะอะไร + คำแนะนำ

ทุกกฎอ้างอิง metrics และ THRESHOLDS ด้านล่าง (ปรับได้ที่เดียว ควรอธิบายเหตุผลของค่าในรายงาน)
"""
from __future__ import annotations

from dataclasses import dataclass, field

THRESHOLDS = {
    "cpu_high": 0.85,          # CPU util ตั้งแต่นี้ = CPU ถูกใช้หนัก
    "cpu_low": 0.50,           # CPU util ต่ำกว่านี้ = CPU ว่างมาก
    "disk_high": 0.80,         # disk util ตั้งแต่นี้ = disk เป็นคอขวด
    "swap_share_high": 0.60,   # สัดส่วนเวลา disk ที่ใช้โหลด page ตั้งแต่นี้ = ปัญหามาจาก paging
    "thrash_fraction": 0.25,   # สัดส่วนเวลาที่ detector เจอ thrashing ตั้งแต่นี้ = thrashing
    "fault_rate_mid": 0.10,    # page fault rate ตั้งแต่นี้ = memory ตึง
    "ready_long": 1.5,         # ความยาวคิว READY เฉลี่ยตั้งแต่นี้ = คิวยาว
    "fairness_low": 0.60,      # Jain index ต่ำกว่านี้ = ไม่เป็นธรรม
}

CPU_BOUND = "CPU_BOUND"
IO_BOUND = "IO_BOUND"
THRASHING = "THRASHING"
MEMORY_PRESSURE = "MEMORY_PRESSURE"
UNDERUTILIZED = "UNDERUTILIZED"
UNFAIR = "UNFAIR"
BALANCED = "BALANCED"


@dataclass
class Finding:
    label: str
    title: str
    evidence: dict
    recommendation: str
    suggested_config: dict = field(default_factory=dict)


@dataclass
class Diagnosis:
    label: str                       # ผลวินิจฉัยหลัก
    title: str
    evidence: dict
    recommendation: str
    suggested_config: dict           # ค่าที่ควรลองใน What-if ({} = ไม่มี config ไหนแก้ได้)
    findings: list                   # ผลวินิจฉัยรอง (Finding) เช่น UNFAIR

    def to_dict(self) -> dict:
        return {
            "label": self.label, "title": self.title, "evidence": self.evidence,
            "recommendation": self.recommendation, "suggested_config": self.suggested_config,
            "findings": [f.__dict__ for f in self.findings],
        }


def _pct(x: float) -> str:
    return f"{x * 100:.0f}%"


def diagnose(metrics: dict, config=None) -> Diagnosis:
    T = THRESHOLDS
    cpu, disk = metrics["cpu_util"], metrics["disk_util"]
    swap, fault = metrics["swap_share"], metrics["page_fault_rate"]
    thr, ready = metrics["thrashing_fraction"], metrics["avg_ready_queue"]
    ram = config.ram_frames if config is not None else None

    ev_common = {
        "cpu_util": round(cpu, 3), "disk_util": round(disk, 3),
        "swap_share": round(swap, 3), "page_fault_rate": round(fault, 3),
        "thrashing_fraction": round(thr, 3), "avg_ready_queue": round(ready, 2),
    }

    primary: Finding
    if thr >= T["thrash_fraction"] and swap >= T["swap_share_high"]:
        primary = Finding(
            THRASHING, "Thrashing: CPU ว่างเพราะ disk ถูกใช้โหลด page ตลอด",
            ev_common,
            f"RAM น้อยกว่า working set ของ process ที่รันพร้อมกัน (thrashing {_pct(thr)} ของเวลา, "
            f"CPU util {_pct(cpu)}) เพิ่ม RAM หรือลดจำนวน process ที่รันพร้อมกัน",
            {"ram_frames": ram * 2} if ram else {},
        )
    elif fault >= T["fault_rate_mid"] and swap >= T["swap_share_high"] and cpu < T["cpu_high"]:
        primary = Finding(
            MEMORY_PRESSURE, "Memory ตึง: page fault สูงและทำให้ CPU ว่างบางส่วน",
            ev_common,
            f"page fault rate {_pct(fault)} และ disk ส่วนใหญ่ใช้โหลด page ลองเพิ่ม RAM",
            {"ram_frames": max(ram + 1, int(ram * 1.5))} if ram else {},
        )
    elif disk >= T["disk_high"] and swap < T["swap_share_high"] and cpu < T["cpu_high"]:
        primary = Finding(
            IO_BOUND, "I/O-bound: disk เป็นคอขวด",
            ev_common,
            f"disk util {_pct(disk)} จากงาน I/O ของ process เอง (ไม่ใช่ paging) "
            "การเพิ่ม CPU/RAM ไม่ช่วย ควรลดคิวรอ disk (เพิ่มอุปกรณ์/ปรับ disk scheduling)",
            {},
        )
    elif cpu >= T["cpu_high"] and ready >= T["ready_long"]:
        primary = Finding(
            CPU_BOUND, "CPU-bound: CPU เต็มและมีคิวรอยาว",
            ev_common,
            f"CPU util {_pct(cpu)} และคิว READY เฉลี่ย {ready:.1f} ตัว ต้องการ CPU เพิ่ม "
            "หรือลดงาน; ถ้าสนใจเวลาตอบสนอง ให้ลอง quantum เล็กลงหรือ priority",
            {},
        )
    elif cpu < T["cpu_low"] and ready < 0.5 and disk < T["cpu_low"]:
        primary = Finding(
            UNDERUTILIZED, "Underutilized: ทรัพยากรว่างเกือบทั้งหมด",
            ev_common,
            "workload เบาเกินไปสำหรับระบบนี้ ไม่มีคอขวด (เพิ่มจำนวน process เพื่อทดสอบ)",
            {},
        )
    else:
        primary = Finding(BALANCED, "Balanced: ไม่พบคอขวดเด่นชัด", ev_common,
                          "การใช้ทรัพยากรค่อนข้างสมดุล", {})

    findings = []
    if metrics["finished_processes"] >= 2 and metrics["fairness"] < T["fairness_low"]:
        findings.append(Finding(
            UNFAIR, "ไม่เป็นธรรม: บาง process ช้ากว่าตัวอื่นมาก",
            {"fairness": round(metrics["fairness"], 3)},
            f"Jain index {metrics['fairness']:.2f} ลอง round-robin/quantum เล็กลง หรือเปิด aging",
            {"aging_interval": 10} if config is not None and config.scheduler == "priority" else {},
        ))
    if not metrics["completed"]:
        findings.append(Finding(
            "INCOMPLETE", "จำลองไม่จบภายใน max_ticks",
            {"total_ticks": metrics["total_ticks"]},
            "เพิ่ม max_ticks หรือระบบอาจติด thrashing/starvation", {},
        ))

    return Diagnosis(primary.label, primary.title, primary.evidence,
                     primary.recommendation, primary.suggested_config, findings)
