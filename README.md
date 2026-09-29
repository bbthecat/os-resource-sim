# OS Resource Manager Simulator
### Multi-Resource Allocation & Bottleneck Analyzer

โปรแกรมจำลองการจัดสรรทรัพยากรของระบบปฏิบัติการ (CPU, RAM, I/O) ที่แสดงให้เห็นว่า **ทรัพยากรแต่ละชนิดส่งผลต่อกันอย่างไร** พร้อมตัววิเคราะห์คอขวด (Bottleneck Analyzer) ที่บอกว่าระบบช้าเพราะอะไรและควรปรับอะไร

> โปรเจกต์วิชา Operating Systems | Section 4

---

## สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [ฟีเจอร์](#ฟีเจอร์)
3. [ขอบเขต: ทำ / ไม่ทำ](#ขอบเขต-ทำ--ไม่ทำ)
4. [สถาปัตยกรรม](#สถาปัตยกรรม)
5. [การติดตั้ง](#การติดตั้ง)
6. [วิธีรัน](#วิธีรัน)
7. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
8. [Workload สำเร็จรูป](#workload-สำเร็จรูป)
9. [API](#api)
10. [การทดลองและการทดสอบ](#การทดลองและการทดสอบ)
11. [สมาชิกและหน้าที่](#สมาชิกและหน้าที่)
12. [Roadmap](#roadmap)

---

## ภาพรวม

ระบบจริงมักช้าเพราะทรัพยากรหลายชนิดส่งผลต่อกัน เช่น

```
RAM ไม่พอ → page fault เยอะ → disk I/O หนัก → process รอ → CPU ว่าง
```

โปรเจกต์นี้จำลองห่วงโซ่นี้ในระบบเดียว โดย

- จำลองเวลาแบบ **discrete-event (ทีละ tick)** ไม่ใช้ thread จริง ทำให้ผลซ้ำได้ (deterministic) เมื่อใช้ seed เดิม
- เก็บ **snapshot ทุก tick** แล้วส่งให้ frontend "เล่นซ้ำ" (play / pause / step / scrub)
- วินิจฉัยคอขวดจาก metrics แล้วให้ปุ่ม **What-if** เทียบผลก่อน/หลังปรับค่า

## ฟีเจอร์

| ระดับ | ฟีเจอร์ |
|---|---|
| **แกนหลัก** | Process model, Scheduler (FCFS, Round Robin, Priority), Metrics (waiting, turnaround, utilization, throughput) |
| **จุดขาย** | Memory manager (paging, FIFO/LRU) + I/O manager ที่ส่งผลต่อกัน, ตรวจจับ thrashing |
| **เพิ่มคะแนน** | Bottleneck Analyzer + คำแนะนำ, What-if / Compare แบบ A/B |
| **เลือกทำ** | Deadlock detection + recovery (kill / preempt / rollback) หรือ Quota & Fairness (Jain's Index) |

**หน้าจอ Dashboard:** Playback controls, Gauge (CPU/RAM/I/O), Queue lanes, Memory grid, Gantt chart, Utilization chart, Process table, Bottleneck card, Event log

## ขอบเขต: ทำ / ไม่ทำ

**ทำ**
- จำลองการจัดสรร CPU, RAM (paging) และ I/O (disk queue) แบบรวมในระบบเดียว
- วิเคราะห์คอขวดและเทียบผลก่อน/หลังปรับค่า
- ชุด workload 4 แบบ พร้อมการทดลองเชิงตัวเลข

**ไม่ทำ**
- ไม่ควบคุม process จริงของ OS (เป็นการจำลองล้วน)
- ไม่ใช้ RAG / Banker's Algorithm เป็นจุดขายหลัก (เน้น recovery และผลต่อ throughput ถ้าทำส่วน deadlock)
- ไม่จำลองระดับ hardware (cache, TLB, pipeline)
- ไม่ได้เป็น simulator เดี่ยวของอัลกอริทึมใดอัลกอริทึมหนึ่ง แต่เน้นการทำงานร่วมกันของหลาย resource

## สถาปัตยกรรม

```
┌──────────────────┐  HTTP/JSON  ┌───────────────┐   เรียก   ┌──────────────────┐
│ React (Vite, TS) │ ──────────▶ │ FastAPI (api/)│ ────────▶ │ sim/ engine      │
│ เล่น snapshot ซ้ำ │ ◀────────── │ POST /simulate│ ◀──────── │ คืน timeline ก้อนเดียว│
└──────────────────┘             └───────────────┘           └──────────────────┘
```

หลักการออกแบบ:
1. `sim/` เป็น Python ล้วน **ห้าม import fastapi หรือ UI ใดๆ** เพื่อทดสอบและทดลองได้อิสระ
2. Backend รันจำลองจนจบแล้วส่ง timeline ทั้งก้อนครั้งเดียว ไม่ใช้ WebSocket
3. Frontend เป็นคนควบคุมการเล่น (cursor) เอง จึงลื่นและเลื่อนย้อนได้
4. สัญญาระหว่างสองฝั่งคือ `api/schemas.py` ⇄ `frontend/src/types/sim.ts` (ต้องตรงกันเสมอ)

### ตัวอย่าง snapshot ต่อ tick

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

## การติดตั้ง

**ต้องมี:** Python 3.10+, Node.js 18+, npm

```bash
# 1) Backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r api/requirements.txt
pip install pytest matplotlib pandas   # สำหรับเทสต์และการทดลอง

# 2) Frontend
cd frontend
npm install
cd ..
```

## วิธีรัน

### โหมดพัฒนา (เปิด 2 เทอร์มินัล)

```bash
# เทอร์มินัล 1: API
uvicorn api.main:app --reload --port 8000

# เทอร์มินัล 2: Frontend
cd frontend && npm run dev
```

เปิด http://localhost:5173

> Vite ตั้ง proxy `/api` → `localhost:8000` ไว้แล้วใน `vite.config.ts`

### โหมด demo (คำสั่งเดียว)

```bash
cd frontend && npm run build && cd ..
uvicorn api.main:app --port 8000
```

เปิด http://localhost:8000 (FastAPI เสิร์ฟ `frontend/dist`)

### ใช้ Makefile

```bash
make dev          # รัน api + frontend
make test         # pytest ทั้งหมด
make build        # build frontend
make experiments  # รันการทดลองทั้งหมดสำหรับรายงาน
```

### ยังไม่มี engine จริง? ใช้ mock

ตั้งค่าให้ `api/service.py` เรียก `api/mock.py` แทน engine เพื่อให้ฝั่ง frontend ทำงานต่อได้ก่อน

## โครงสร้างโปรเจกต์

```
os-resource-sim/
├── sim/            # แกนจำลอง (process, engine, scheduler, memory, io, metrics, analyzer)
│   ├── scheduler/  # fcfs, round_robin, priority
│   ├── memory/     # manager, replacement (FIFO/LRU), thrashing
│   ├── io/         # disk queue, swap I/O
│   ├── deadlock/   # (เลือกทำ) detector, recovery
│   └── quota/      # (เลือกทำ) groups, fairness
├── workloads/      # generator + ไฟล์ workload JSON
├── api/            # FastAPI: main, schemas, service, mock
├── frontend/       # React + Vite + TypeScript + Tailwind
├── experiments/    # สคริปต์ทดลอง + results/ (CSV, PNG)
├── tests/          # pytest
└── docs/           # design.md, api-contract.md, report/, slides/
```

## Workload สำเร็จรูป

| ชุด | ลักษณะ | สิ่งที่ควรเห็น |
|---|---|---|
| `cpu_heavy` | CPU burst ยาว, I/O น้อย | CPU util สูง, ready queue ยาว |
| `io_heavy` | CPU burst สั้น, I/O ยาว | CPU ว่าง, I/O util สูง |
| `memory_hog` | จำนวน page รวมเกิน RAM | thrashing, page fault พุ่ง |
| `mixed` | ผสมทุกแบบ | ใกล้เคียงระบบจริง |
| `textbook_examples` | ตัวอย่างจากตำรา | ใช้ตรวจความถูกต้องของ scheduler |

ทุก workload สร้างด้วย `random.seed(...)` (ค่าเริ่มต้น 42) เพื่อให้ผลซ้ำได้

## API

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/workloads` | รายชื่อ workload ที่มี |
| POST | `/api/simulate` | รับ `SimConfig` คืน `SimResult` (timeline, gantt, processes, summary, diagnosis) |
| POST | `/api/compare` | รับ config สองชุด (A, B) คืนผลทั้งสองสำหรับ What-if |

**SimConfig**

| ฟิลด์ | ค่าที่รับ | ค่าเริ่มต้น |
|---|---|---|
| `workload` | `cpu_heavy`, `io_heavy`, `memory_hog`, `mixed` | `mixed` |
| `scheduler` | `fcfs`, `rr`, `priority` | `rr` |
| `quantum` | 1–32 | 4 |
| `ram_frames` | 2–128 | 16 |
| `replacement` | `fifo`, `lru` | `lru` |
| `seed` | จำนวนเต็ม | 42 |

เอกสาร Swagger อัตโนมัติที่ http://localhost:8000/docs

### รูปแบบ event

| Event | ความหมาย |
|---|---|
| `page_fault:<pid>` | process เกิด page fault |
| `evict:<pid>` | frame ของ process ถูกขับออก |
| `io_done:<pid>` | I/O ของ process เสร็จ |

## การทดลองและการทดสอบ

```bash
pytest -q
python -m experiments.exp_quantum        # RR quantum 1, 2, 4, 8, 16
python -m experiments.exp_ram_size       # RAM 8, 16, 32, 64 frames
python -m experiments.exp_replacement    # FIFO vs LRU (Belady's anomaly)
python -m experiments.exp_whatif         # ก่อน/หลังทำตามคำแนะนำของ Analyzer
```

ผลลัพธ์ถูกบันทึกใน `experiments/results/`

**การตรวจความถูกต้อง:** `tests/test_scheduler.py` เทียบผล FCFS/RR/Priority กับตัวอย่างในตำราด้วยค่าที่คำนวณมือ ก่อนเชื่อกราฟใดๆ

### กฎการวินิจฉัยของ Analyzer (ค่าเริ่มต้น)

| เงื่อนไข | ผลวินิจฉัย |
|---|---|
| CPU util > 90% และ ready queue เฉลี่ย > 3 | CPU-bound |
| page fault rate > 30% และ I/O util > 80% | Memory-bound (thrashing) |
| I/O util > 90% และ CPU util < 50% | I/O-bound |
| อื่นๆ | Balanced |

## สมาชิกและหน้าที่

| ชื่อ | รหัสนักศึกษา | หน้าที่ |
|---|---|---|
| _(ชื่อ-สกุล)_ | _(รหัส)_ | `sim/` engine, scheduler, snapshot |
| _(ชื่อ-สกุล)_ | _(รหัส)_ | `sim/` memory, io, analyzer, `api/`, workloads |
| _(ชื่อ-สกุล)_ | _(รหัส)_ | `frontend/`, experiments, docs |

## Roadmap

- [ ] สัปดาห์ 1: ตกลง schema, mock API, engine FCFS, layout เปล่า
- [ ] สัปดาห์ 2: Round Robin, ControlPanel, PlaybackBar, Gantt
- [ ] สัปดาห์ 3: Memory + I/O จริง, MemoryGrid, QueueLane, Gauge
- [ ] สัปดาห์ 4: Utilization chart, Bottleneck Analyzer, ต่อ API จริง
- [ ] สัปดาห์ 5: Compare mode, การทดลอง, (เลือกทำ) Deadlock หรือ Quota
- [ ] สัปดาห์ 6: ซ้อม demo, แก้บั๊ก, รายงาน

## ข้อควรระวัง

- ถ้า simulation ยาวมาก JSON จะใหญ่ ตั้ง `max_ticks` ไว้ไม่เกิน ~2,000
- ถ้า fetch ไม่ผ่านตอนพัฒนา ให้เช็ก proxy ใน `vite.config.ts` และ CORS ใน `api/main.py`
- แก้ `schemas.py` ต้องแก้ `types/sim.ts` ให้ตรงกันทุกครั้ง

## License

โปรเจกต์เพื่อการศึกษา รายวิชา Operating Systems
