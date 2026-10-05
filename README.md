<<<<<<< Updated upstream
# os-resource-sim
=======
<div align="center">

# 🖥️ OS Resource Manager Simulator

**Multi-Resource Allocation & Bottleneck Analyzer**

จำลองว่า CPU, RAM และ I/O ส่งผลต่อกันอย่างไร แล้ววินิจฉัยว่าระบบช้าเพราะอะไร

`Python` · `FastAPI` · `React` · `TypeScript` · `Tailwind`

Operating Systems Project · Section 4

</div>

---

## 📌 แนวคิดหลัก

ระบบปฏิบัติการจริงไม่ได้ช้าเพราะทรัพยากรเดียว แต่เพราะทรัพยากรหลายชนิด **ส่งผลต่อกันเป็นลูกโซ่**

```
RAM ไม่พอ ─▶ page fault เยอะ ─▶ disk I/O หนัก ─▶ process รอ ─▶ CPU ว่าง (ทั้งที่ระบบช้า)
```

โปรเจกต์นี้จำลองลูกโซ่ดังกล่าวในระบบเดียว แล้วใช้ **Bottleneck Analyzer** บอกว่าคอขวดคืออะไร พร้อมปุ่ม **What-if** พิสูจน์ว่าคำแนะนำช่วยได้จริงกี่เปอร์เซ็นต์

> **สรุปประโยคเดียว:** เครื่องมือจำลองที่ตอบว่า "ระบบช้าเพราะ CPU, RAM หรือ I/O และควรปรับอะไรถึงจะดีขึ้น"

## ✨ ฟีเจอร์

| ระดับ | ฟีเจอร์ |
|---|---|
| 🧱 **แกนหลัก** | Process model · Scheduler (FCFS, Round Robin, Priority) · Metrics |
| ⭐ **จุดขาย** | Memory manager (paging, FIFO/LRU) + I/O manager ที่ส่งผลต่อกัน · ตรวจจับ thrashing |
| 🚀 **เพิ่มคะแนน** | Bottleneck Analyzer + คำแนะนำ · What-if / Compare แบบ A/B |
| 🎁 **เลือกทำ** | Deadlock detection + recovery **หรือ** Quota & Fairness (Jain's Index) |

**Dashboard:** Playback (play/pause/step/scrub) · Gauge CPU/RAM/I/O · Queue lanes · Memory grid · Gantt · Utilization chart · Process table · Bottleneck card · Event log

## 🎯 ขอบเขต

| ✅ ทำ | ❌ ไม่ทำ |
|---|---|
| จำลอง CPU + RAM (paging) + I/O ในระบบเดียว | ควบคุม process จริงของ OS |
| วิเคราะห์คอขวด + เทียบก่อน/หลังปรับค่า | จำลองระดับ hardware (cache, TLB, pipeline) |
| Workload 4 แบบ + การทดลองเชิงตัวเลข | เป็น simulator เดี่ยวของอัลกอริทึมใดอัลกอริทึมหนึ่ง |
| Deadlock recovery (ถ้าเลือกทำ) | เน้น RAG / Banker's เป็นจุดขายหลัก |

## 🏗️ สถาปัตยกรรม

```
┌───────────────────┐  HTTP / JSON  ┌────────────────┐  เรียก  ┌─────────────────────┐
│ React (Vite + TS) │ ────────────▶ │ FastAPI (api/) │ ──────▶ │ sim/  engine        │
│ เล่น snapshot ซ้ำ  │ ◀──────────── │ POST /simulate │ ◀────── │ คืน timeline ก้อนเดียว │
└───────────────────┘               └────────────────┘         └─────────────────────┘
```

**หลักการออกแบบ**

1. `sim/` เป็น Python ล้วน ห้าม import fastapi หรือ UI เพื่อให้เทสต์และทดลองได้อิสระ
2. จำลองแบบ **discrete-event (ทีละ tick)** ไม่ใช้ thread จริง → ผลซ้ำได้เมื่อ seed เดิม
3. Backend รันจนจบแล้วส่ง **timeline ก้อนเดียว** (ไม่ใช้ WebSocket) frontend เป็นคนควบคุมการเล่นเอง
4. สัญญากลางคือ `api/schemas.py` ⇄ `frontend/src/types/sim.ts` ต้องตรงกันเสมอ

**ตัวอย่าง snapshot ต่อ tick**

```json
{
  "t": 42,
  "running": 3,
  "ready_queue": [1, 5, 2],
  "io_queue": [4],
  "frames": [1, 1, 3, 3, 3, null, 5, 2],
  "events": ["page_fault:3", "io_done:4"],
  "util": { "cpu": 0.85, "ram": 0.75, "io": 0.6 }
}
```

## ⚡ Quick Start

**ต้องมี:** Python 3.10+ · Node.js 18+

```bash
# ติดตั้ง
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r api/requirements.txt pytest matplotlib pandas
cd frontend && npm install && cd ..

# รัน (เปิด 2 เทอร์มินัล)
uvicorn api.main:app --reload --port 8000      # เทอร์มินัล 1: API
cd frontend && npm run dev                     # เทอร์มินัล 2: UI → http://localhost:5173
```

**โหมด demo (คำสั่งเดียว):**

```bash
cd frontend && npm run build && cd ..
uvicorn api.main:app --port 8000               # เปิด http://localhost:8000
```

**Makefile:** `make dev` · `make test` · `make build` · `make experiments`

> ยังไม่มี engine จริง? ให้ `api/service.py` เรียก `api/mock.py` ไปก่อน ฝั่ง frontend จะทำงานต่อได้ทันที

## 📁 โครงสร้างโปรเจกต์

```
os-resource-sim/
│
├── README.md                          # วิธีติดตั้ง/รัน, ขอบเขต ทำ/ไม่ทำ, สกรีนช็อต
├── Makefile                           # make dev / make test / make build / make experiments
├── .gitignore
├── docker-compose.yml                 # (ไม่บังคับ) รัน api + frontend พร้อมกัน
│
├── sim/                               # ★ แกนจำลอง (Python ล้วน ห้าม import fastapi/streamlit)
│   ├── __init__.py
│   ├── config.py                      # SimConfig (dataclass): scheduler, quantum, ram_frames, seed
│   ├── process.py                     # Process, PCB, State (NEW/READY/RUNNING/WAITING_IO/WAITING_MEM/DONE)
│   ├── engine.py                      # Simulation clock + tick loop + เก็บ snapshot ทุก tick
│   ├── events.py                      # กำหนดรูปแบบ string ของ event (page_fault:3, io_done:4, evict:2)
│   ├── snapshot.py                    # สร้าง snapshot dict ต่อ tick (สัญญากับ UI)
│   │
│   ├── scheduler/
│   │   ├── __init__.py
│   │   ├── base.py                    # BaseScheduler: pick(), on_tick(), add(), queue
│   │   ├── fcfs.py
│   │   ├── round_robin.py
│   │   └── priority.py                # (เพิ่ม aging ถ้ามีเวลา)
│   │
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── manager.py                 # frame table, page table, access(), frame_owners()
│   │   ├── replacement.py             # FIFO, LRU (เพิ่ม Clock/Optimal ได้)
│   │   └── thrashing.py               # ตรวจ page fault rate ในหน้าต่าง N tick
│   │
│   ├── io/
│   │   ├── __init__.py
│   │   └── manager.py                 # disk queue, service time, swap I/O
│   │
│   ├── deadlock/                      # (เลือกทำ - ชั้น 3) ตัดทั้งโฟลเดอร์ได้
│   │   ├── __init__.py
│   │   ├── resources.py               # ทรัพยากรหลายชนิด
│   │   ├── detector.py                # wait-for graph + หา cycle
│   │   └── recovery.py                # kill / preempt / rollback
│   │
│   ├── quota/                         # (เลือกทำ - ชั้น 4) ตัดทั้งโฟลเดอร์ได้
│   │   ├── __init__.py
│   │   ├── groups.py                  # จัด process เป็น group/user
│   │   └── fairness.py                # Jain's Fairness Index
│   │
│   ├── metrics.py                     # waiting, turnaround, utilization, throughput, fault rate
│   └── analyzer.py                    # Bottleneck Analyzer + คำแนะนำ (diagnose)
│
├── workloads/
│   ├── __init__.py
│   ├── generator.py                   # สร้าง process ด้วย random.seed
│   ├── cpu_heavy.json
│   ├── io_heavy.json
│   ├── memory_hog.json
│   ├── mixed.json
│   └── textbook_examples.json         # ตัวอย่างในตำรา ไว้ตรวจความถูกต้อง
│
├── api/                               # ★ ชั้นคั่นกลาง FastAPI
│   ├── __init__.py
│   ├── main.py                        # app, CORS, routes, mount frontend/dist
│   ├── schemas.py                     # Pydantic: SimConfig, Snapshot, SimResult, Diagnosis
│   ├── service.py                     # run_simulation(), run_compare(), list_workloads()
│   ├── mock.py                        # timeline ปลอมตาม schema (ให้ frontend เริ่มงานได้ก่อน)
│   └── requirements.txt               # fastapi, uvicorn, pydantic
│
├── frontend/                          # ★ React + Vite + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                 # proxy /api -> localhost:8000
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css                  # Tailwind + ตัวแปรสีธีมมืด + ฟอนต์
│       │
│       ├── api/
│       │   └── client.ts              # fetch wrapper: simulate(), compare(), workloads()
│       ├── types/
│       │   └── sim.ts                 # TypeScript types ตรงกับ schemas.py
│       ├── store/
│       │   └── useSimStore.ts         # Zustand: config, result, cursor, playing, speed
│       ├── hooks/
│       │   ├── usePlayback.ts         # requestAnimationFrame loop
│       │   └── useHotkeys.ts          # Space = play/pause, ←/→ = step
│       ├── lib/
│       │   ├── colors.ts              # pidColor(), statusColor()
│       │   ├── format.ts              # format ตัวเลข/เปอร์เซ็นต์
│       │   └── delta.ts               # คำนวณ % เปลี่ยนแปลงสำหรับ Compare
│       │
│       └── components/
│           ├── layout/
│           │   ├── Shell.tsx          # โครงหน้าจอหลัก
│           │   ├── Header.tsx
│           │   └── Sidebar.tsx
│           ├── ControlPanel.tsx       # workload / scheduler / quantum / RAM / replacement
│           ├── PlaybackBar.tsx        # play, pause, step, scrub slider, speed
│           ├── GaugeRow.tsx           # มิเตอร์ CPU / RAM / I/O (เขียว-เหลือง-แดง)
│           ├── QueueLane.tsx          # RUNNING / READY / I/O เป็นกล่องเลื่อน
│           ├── MemoryGrid.tsx         # ช่อง frame RAM + แอนิเมชัน page fault
│           ├── GanttChart.tsx         # SVG Gantt + playhead
│           ├── UtilizationChart.tsx   # Recharts เส้น 3 สี + playhead
│           ├── ProcessTable.tsx       # ตารางสถิติต่อ process
│           ├── BottleneckCard.tsx     # ผลวินิจฉัย + คำแนะนำ
│           ├── EventLog.tsx           # log event ทีละ tick (page_fault, io_done, ...)
│           ├── WhatIfCompare.tsx      # split-screen A/B + ตาราง delta
│           └── ui/                    # ชิ้นเล็กใช้ซ้ำ
│               ├── Card.tsx
│               ├── Badge.tsx
│               ├── Select.tsx
│               └── Slider.tsx
│
├── experiments/                       # สคริปต์ทดลองสำหรับรายงาน (เรียก sim/ ตรงๆ)
│   ├── exp_quantum.py                 # RR quantum 1, 2, 4, 8, 16
│   ├── exp_ram_size.py                # RAM 8, 16, 32, 64 frames
│   ├── exp_replacement.py             # FIFO vs LRU (Belady's anomaly)
│   ├── exp_whatif.py                  # ก่อน/หลังทำตามคำแนะนำ
│   ├── plot.py                        # วาดกราฟ PNG สำหรับรายงาน
│   └── results/                       # CSV / PNG ที่ใช้ในรายงาน
│
├── tests/
│   ├── test_scheduler.py              # เทียบกับตัวอย่างตำรา
│   ├── test_memory.py
│   ├── test_engine.py
│   ├── test_analyzer.py
│   ├── test_snapshot.py               # snapshot ตรง schema
│   ├── test_api.py                    # ทดสอบ endpoint ด้วย TestClient
│   └── test_deadlock.py               # (ถ้าทำชั้น 3)
│
└── docs/
    ├── design.md                      # สถาปัตยกรรม, data model, interface
    ├── api-contract.md                # JSON schema + รูปแบบ events (ตกลงวันแรก)
    ├── report/                        # รายงานฉบับสมบูรณ์
    └── slides/                        # สไลด์พรีเซนต์
```

## 🧪 Workload สำเร็จรูป

| ชุด | ลักษณะ | สิ่งที่ควรเห็น |
|---|---|---|
| `cpu_heavy` | CPU burst ยาว, I/O น้อย | CPU util สูง, ready queue ยาว |
| `io_heavy` | CPU burst สั้น, I/O ยาว | CPU ว่าง, I/O util สูง |
| `memory_hog` | page รวมเกิน RAM | thrashing, page fault พุ่ง |
| `mixed` | ผสมทุกแบบ | ใกล้ระบบจริง |
| `textbook_examples` | ตัวอย่างจากตำรา | ตรวจความถูกต้องของ scheduler |

ทุกชุดสร้างด้วย `random.seed` (ค่าเริ่มต้น `42`) เพื่อให้ผลซ้ำได้

## 🔌 API

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/workloads` | รายชื่อ workload |
| `POST` | `/api/simulate` | รับ `SimConfig` → คืน `SimResult` |
| `POST` | `/api/compare` | รับ config สองชุด → คืนผลทั้งสอง (What-if) |

Swagger: http://localhost:8000/docs

**SimConfig**

| ฟิลด์ | ค่าที่รับ | ค่าเริ่มต้น |
|---|---|---|
| `workload` | `cpu_heavy` `io_heavy` `memory_hog` `mixed` | `mixed` |
| `scheduler` | `fcfs` `rr` `priority` | `rr` |
| `quantum` | 1–32 | `4` |
| `ram_frames` | 2–128 | `16` |
| `replacement` | `fifo` `lru` | `lru` |
| `seed` | จำนวนเต็ม | `42` |

**Events:** `page_fault:<pid>` · `evict:<pid>` · `io_done:<pid>`

## 🩺 กฎวินิจฉัยของ Analyzer

| เงื่อนไข | ผลวินิจฉัย | คำแนะนำ |
|---|---|---|
| CPU util > 90% และ ready queue เฉลี่ย > 3 | **CPU-bound** | เพิ่ม CPU / ปรับ quantum |
| page fault rate > 30% และ I/O util > 80% | **Memory-bound (thrashing)** | เพิ่ม RAM / ลด multiprogramming |
| I/O util > 90% และ CPU util < 50% | **I/O-bound** | ปรับ disk scheduling / เพิ่ม I/O device |
| อื่นๆ | **Balanced** | – |

## 🔬 การทดลองและทดสอบ

```bash
pytest -q
python -m experiments.exp_quantum        # RR quantum 1, 2, 4, 8, 16
python -m experiments.exp_ram_size       # RAM 8, 16, 32, 64 frames
python -m experiments.exp_replacement    # FIFO vs LRU (Belady's anomaly)
python -m experiments.exp_whatif         # ก่อน/หลังทำตามคำแนะนำ
```

ผลลัพธ์อยู่ใน `experiments/results/` · `tests/test_scheduler.py` ตรวจกับตัวอย่างในตำราก่อนเชื่อกราฟ

## 👥 สมาชิก

| ชื่อ-สกุล | รหัสนักศึกษา | รับผิดชอบ |
|---|---|---|
| _(เติมชื่อ)_ | _(เติมรหัส)_ | `sim/` engine, scheduler, snapshot, tests |
| _(เติมชื่อ)_ | _(เติมรหัส)_ | `sim/` memory, io, metrics, analyzer, `api/`, workloads |
| _(เติมชื่อ)_ | _(เติมรหัส)_ | `frontend/`, experiments, docs |

## 🗓️ Roadmap

- [ ] **สัปดาห์ 1** · ตกลง schema, mock API, engine FCFS, layout เปล่า
- [ ] **สัปดาห์ 2** · Round Robin, ControlPanel, PlaybackBar, Gantt
- [ ] **สัปดาห์ 3** · Memory + I/O จริง, MemoryGrid, QueueLane, Gauge
- [ ] **สัปดาห์ 4** · Utilization chart, Analyzer, ต่อ API จริง
- [ ] **สัปดาห์ 5** · Compare mode, การทดลอง, (เลือกทำ) Deadlock/Quota
- [ ] **สัปดาห์ 6** · ซ้อม demo, แก้บั๊ก, รายงาน

## ⚠️ ข้อควรระวัง

- ตั้ง `max_ticks` ไม่เกิน ~2,000 เพื่อไม่ให้ JSON ใหญ่เกินไป
- fetch ไม่ผ่านตอนพัฒนา → เช็ก proxy ใน `vite.config.ts` และ CORS ใน `api/main.py`
- แก้ `schemas.py` ต้องแก้ `types/sim.ts` ให้ตรงกันทุกครั้ง

---

<div align="center">โปรเจกต์เพื่อการศึกษา · รายวิชา Operating Systems</div>
>>>>>>> Stashed changes
