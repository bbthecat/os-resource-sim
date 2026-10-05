<div align="center">

# 🖥️ OS Resource Manager Simulator

**Multi-Resource Allocation & Bottleneck Analyzer**

ระบบจำลองการทำงานและจัดสรรทรัพยากรระบบปฏิบัติการ (CPU, RAM, I/O) แบบครบวงจร พร้อมระบบวิเคราะห์คอขวดอัตโนมัติ (Bottleneck Analyzer) และการเปรียบเทียบผลลัพธ์ (What-If Analysis)

`Python 3.10+` · `FastAPI` · `React 18` · `TypeScript` · `TailwindCSS` · `Vite` · `Vercel`

---

</div>

## 📌 แนวคิดหลัก (Core Concept)

ระบบปฏิบัติการจริงไม่ได้ช้าเพราะทรัพยากรตัวใดตัวหนึ่งเพียงอย่างเดียว แต่ทรัพยากรหลายชนิด **ส่งผลกระทบต่อกันเป็นลูกโซ่ (Chain Reaction)**:

```
RAM ไม่พอ ──▶ เกิด Page Fault ถี่ ──▶ Disk I/O ทำงานหนัก ──▶ Process ต้องรอ I/O ──▶ CPU เกิด Idle (ระบบช้าทั้งที่ CPU ไม่เต็ม)
```

โปรเจกต์นี้จำลองสภาวะการทำงานแบบสมจริงในระบบเดียว และใช้ **Bottleneck Analyzer** ระบุสาเหตุที่แท้จริง พร้อมปุ่ม **What-If Compare (A/B Testing)** เพื่อพิสูจน์ผลลัพธ์ว่าเมื่อปรับแต่งค่าตามคำแนะนำแล้ว ระบบทำงานเร็วขึ้นกี่เปอร์เซ็นต์

> 💡 **สรุปในประโยคเดียว:** เครื่องมือจำลองและแสดงผล Telemetry ที่ตอบว่า *"ระบบช้าเพราะ CPU, RAM หรือ I/O และควรปรับจูนอัลกอริทึมใดระบบจึงจะมีประสิทธิภาพสูงสุด"*

---

## ✨ ฟีเจอร์เด่น (Key Features)

| ระดับ | รายละเอียดฟีเจอร์ |
|:---|:---|
| 🧱 **แกนจำลอง OS (Core Engine)** | Process Model (PCB, States, Burst Cycles) · CPU Schedulers (FCFS, SJF, Round Robin, Priority) · คำนวณ Metrics เชิงลึก (Throughput, Turnaround, Waiting time, CPU/RAM/IO Util) |
| ⭐ **ระบบหน่วยความจำและ I/O** | Memory Manager (Paging, Page Fault Detection, Frame Allocation) · Page Replacement (FIFO, LRU) · Thrashing Detection System · Disk I/O Queue Subsystem |
| 🚀 **การวิเคราะห์และแก้ปัญหา** | **Bottleneck Analyzer** วินิจฉัยคอขวดอัตโนมัติ (CPU-bound, Memory-bound, I/O-bound) · **What-If A/B Testing** เปรียบเทียบผลกระทบของ 2 การตั้งค่าแบบแบ่งหน้าจอ |
| 💻 **Interactive Telemetry Dashboard** | ควบคุม Playback (Play/Pause, Step, Speed, Time Scrubbing) · Real-time Gantt Chart · Multi-resource Utilization Area Charts · Animated Queue Lanes · Memory Frame Matrix · Live Event Stream · Process Table |
| 🛠️ **เครื่องมือเสริม** | **Custom Workload Builder** (ออกแบบ Process เองได้ผ่าน GUI) · **Preset Scenarios** (จำลองสถานการณ์ตัวอย่าง 1 คลิก) · **Interactive User Guide Modal** · **Export Report** (PDF, HTML, JSON) |
| 🧪 **ความน่าเชื่อถือและการทดสอบ** | ชุด Unit Test อัตโนมัติ (`pytest`) ครอบคลุม 100% ของ Engine Logic · สคริปต์ Benchmark การทดลองและวาดกราฟสำหรับรายงาน |
| 🌐 **Deployment Ready** | รองรับการ Deploy ขึ้น **Vercel** ทันที (Full-Stack: Vite + Python Serverless) · รองรับ **Docker Compose** และไฟล์คลิกรัน **`start_dev.bat`** |

---

## 🎯 ขอบเขตของระบบ (Scope)

| ✅ สิ่งที่ระบบทำ | ❌ สิ่งที่อยู่นอกเหนือขอบเขต |
|:---|:---|
| จำลอง CPU + RAM (Paging) + I/O ที่ส่งผลต่อกันในระบบเดียว | ควบคุม Process จริงของระบบปฏิบัติการ Host |
| วิเคราะห์คอขวดและเปรียบเทียบผลลัพธ์ก่อน/หลังการปรับแต่ง | จำลองฮาร์ดแวร์ระดับไมโคร (L1/L2/L3 Cache, TLB, Pipeline) |
| Preset Workload หลากหลายรูปแบบ + Benchmark เชิงสถิติ | เป็นเพียงตัวจำลองอัลกอริทึมเดี่ยวๆ โดยไม่เชื่อมโยงทรัพยากร |
| Export สรุปผลการวิเคราะห์ออกมาเป็นรายงาน | – |

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture)

```
┌─────────────────────────────────┐           HTTP / JSON           ┌───────────────────────────────┐
│     React + Vite Frontend       │ ──────────────────────────────▶ │       FastAPI Backend         │
│  (Telemetry Dashboard & Player) │ ◀────────────────────────────── │       (api/service.py)        │
└─────────────────────────────────┘      คืนข้อมูลทั้ง Timeline      └──────────────┬────────────────┘
                                                                                   │ เรียกใช้งาน
                                                                                   ▼
                                                                    ┌───────────────────────────────┐
                                                                    │   OS Simulation Core (sim/)   │
                                                                    │   - Scheduler (FCFS/SJF/RR/P) │
                                                                    │   - Memory (FIFO/LRU/Paging)  │
                                                                    │   - I/O Queue & Thrashing     │
                                                                    │   - Bottleneck Analyzer       │
                                                                    └───────────────────────────────┘
```

### หลักการออกแบบที่สำคัญ:
1. **Decoupled Engine (`sim/`):** พัฒนาด้วย Pure Python ล้วน โดยไม่ผูกติดกับ Web Framework ใดๆ เพื่อความแม่นยำและการเขียน Unit Test ที่ครอบคลุม
2. **Discrete-Event Simulation:** จำลองเหตุการณ์ตามรอบสัญญาณนาฬิกา (Tick-based) แบบ Deterministic เมื่อกำหนด `seed` เดียวกันผลลัพธ์จะตรงกัน 100%
3. **Single Timeline Delivery:** Backend ประมวลผลและส่ง Snapshots ทั้งก้อนให้ Frontend ทำให้สามารถเลื่อนเวลา (Scrubbing), กรอถอยหลัง (Step back), หรือปรับความเร็วได้อย่างลื่นไหลไม่มีสะดุด

---

## ⚡ วิธีการติดตั้งและรันระบบ (Quick Start)

### ข้อกำหนดเบื้องต้น
* **Python:** เวอร์ชัน 3.10 ขึ้นไป
* **Node.js:** เวอร์ชัน 18 ขึ้นไป

---

### วิธีที่ 1: รันผ่าน start_dev.bat (ง่ายที่สุดบน Windows)
ดับเบิลคลิกไฟล์ [`start_dev.bat`](file:///d:/final%20osu/os-resource-sim/start_dev.bat) หรือรันใน Terminal:
```cmd
start_dev.bat
```
*ระบบจะเปิด Backend Server (`http://localhost:8000`) และ Frontend Dev Server (`http://localhost:5173`) ให้พร้อมใช้งานทันที*

---

### วิธีที่ 2: รันแบบ Manual (แยก Terminal)

**1. ติดตั้งและเริ่มทำงาน Backend:**
```bash
# สร้างและเปิด Virtual Environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# ติดตั้ง Dependencies
pip install -r requirements.txt pytest matplotlib pandas

# รัน Backend Server (พอร์ต 8000)
uvicorn api.main:app --reload --port 8000
```

**2. ติดตั้งและเริ่มทำงาน Frontend:**
```bash
cd frontend
npm install
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:5173`

---

### วิธีที่ 3: รันด้วย Docker Compose
```bash
docker compose up --build
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:8000`

---

## 🌐 การ Deploy ขึ้น Vercel

โปรเจกต์นี้ตั้งค่า [`vercel.json`](file:///d:/final%20osu/os-resource-sim/vercel.json) และ Serverless Functions ไว้เรียบร้อยแล้ว รองรับการ Deploy ทั้งเว็บและ API ขึ้น Vercel ในคำสั่งเดียว:

```bash
# วิธีที่ 1: ใช้ Vercel CLI
npx vercel --prod

# วิธีที่ 2: Push ขึ้น GitHub แล้วกด Import Project บน vercel.com
git push origin main
```
*(อ่านขั้นตอนอย่างละเอียดได้ที่ [`VERCEL_DEPLOY.md`](file:///d:/final%20osu/os-resource-sim/VERCEL_DEPLOY.md))*

---

## 🧪 Workload สำเร็จรูป (Built-in Workloads)

| ชุด Workload | คุณลักษณะเด่น | อาการและผลลัพธ์ที่ตรวจพบ |
|:---|:---|:---|
| `cpu_heavy` | Process มี CPU Burst ยาว, เรียกใช้ I/O น้อย | CPU Utilization สูงเกือบ 100%, Ready Queue สะสม |
| `io_heavy` | Process ทำงาน CPU สั้นๆ แล้วรอ Disk I/O นาน | CPU ว่าง (Idle สูง), I/O Utilization หนาแน่น |
| `memory_hog` | มี Working Set ของ Page รวมกันมากกว่าจำนวน RAM Frame | เกิด **Thrashing**, อัตรา Page Fault สูงลิ่ว |
| `mixed` | งานผสมผสานทั้ง 3 รูปแบบ เลียนแบบการใช้งานจริง | แสดงความสมดุลและการจัดลำดับของ Scheduler |
| `textbook_examples` | ข้อมูลตัวอย่างจากตำราเรียน OS (Silberschatz) | ใช้สอบทานความถูกต้องของอัลกอริทึม FCFS/RR |

---

## 🔌 API Documentation

| Method | Path | คำอธิบาย |
|:---|:---|:---|
| `GET` | `/api/health` | ตรวจสอบสถานะการทำงานของ API |
| `GET` | `/api/workloads` | ดึงรายชื่อ Preset Workload ทั้งหมด |
| `POST` | `/api/simulate` | รันการจำลองและส่งผลลัพธ์ Snapshots + Metrics กลับมา |
| `POST` | `/api/compare` | เปรียบเทียบผลลัพธ์แบบ A/B ระหว่าง 2 การตั้งค่า (What-If) |

*Swagger UI เปิดได้ที่: `http://localhost:8000/docs`*

### ตัวแปรการตั้งค่า SimConfig

| ฟิลด์ | ชนิดข้อมูล | ค่าที่รองรับ | ค่าเริ่มต้น |
|:---|:---|:---|:---|
| `workload` | `string` | `cpu_heavy`, `io_heavy`, `memory_hog`, `mixed`, `textbook_examples` | `mixed` |
| `scheduler` | `string` | `fcfs`, `sjf`, `rr`, `priority` | `rr` |
| `quantum` | `integer` | `1` ถึง `32` (สำหรับ Round Robin) | `4` |
| `ram_frames` | `integer` | `2` ถึง `128` เฟรม | `16` |
| `replacement` | `string` | `fifo`, `lru` | `lru` |
| `seed` | `integer` | จำนวนเต็มบวก | `42` |

---

## 🩺 ตรรกะการวิเคราะห์ของ Bottleneck Analyzer

| สภาวะที่ตรวจพบ | ผลการวินิจฉัย | คำแนะนำจากระบบ (Actionable Recommendations) |
|:---|:---|:---|
| CPU Util > 85% และ Ready Queue เฉลี่ย > 2.5 | **CPU-bound** | • ปรับลด Time Quantum (สำหรับ RR)<br>• เปลี่ยนไปใช้อัลกอริทึม SJF เพื่อลด Waiting Time |
| Page Fault Rate > 25% และ I/O Util > 70% | **Memory-bound (Thrashing)** | • เพิ่มขนาด RAM Frames<br>• เปลี่ยนอัลกอริทึม Replacement เป็น LRU<br>• ลด Multiprogramming |
| I/O Util > 80% และ CPU Util < 40% | **I/O-bound** | • เพิ่มอุปกรณ์ I/O Channel<br>• ทำ I/O Buffering / Asynchronous I/O |
| การใช้งานอยู่ในเกณฑ์ปกติ | **Balanced** | ระบบทำงานได้อย่างมีประสิทธิภาพและสมดุล |

---

## 🔬 การทดลองเชิงตัวเลขและชุดการทดสอบ (Testing)

### การรัน Unit Tests:
```bash
pytest -v
```
*(ทดสอบ 18 Test Cases ครอบคลุม Scheduler, Memory, Engine, Snapshot และ API ทั้งหมด 100% ผ่านฉลุย)*

### การรันสคริปต์การทดลองสำหรับรายงาน:
```bash
python -m experiments.exp_schedulers      # เปรียบเทียบ FCFS, SJF, RR, Priority
python -m experiments.exp_quantum         # ผลกระทบของ Quantum 1, 2, 4, 8, 16
python -m experiments.exp_ram_size        # ผลกระทบของ RAM Frames 8, 16, 32, 64
python -m experiments.exp_replacement     # FIFO vs LRU (Belady's Anomaly)
python -m experiments.exp_whatif          # วัดผลเปรียบเทียบก่อน-หลังตามคำแนะนำ
python -m experiments.plot                # สร้างภาพกราฟความละเอียดสูงใน experiments/results/
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
os-resource-sim/
│
├── README.md                          # เอกสารแนะนำและคู่มือโปรเจกต์ฉบับสมบูรณ์
├── VERCEL_DEPLOY.md                   # คู่มือการ Deploy บน Vercel
├── vercel.json                        # การตั้งค่า Vercel Full-Stack Serverless
├── .vercelignore                      # กรองไฟล์ที่ไม่จำเป็นก่อนขึ้น Cloud
├── Makefile                           # คำสั่ง make dev / test / build
├── docker-compose.yml                 # คอนฟิก Docker Compose สำหรับรันบนเซิร์ฟเวอร์
├── start_dev.bat                      # สคริปต์ 1-Click รัน Local บน Windows
├── requirements.txt                   # รายการ Dependencies ของ Python Backend
│
├── sim/                               # ★ แกนหลักจำลองระบบปฏิบัติการ (Pure Python)
│   ├── config.py                      # โครงสร้างข้อมูล SimConfig
│   ├── process.py                     # Process model, PCB และสถานะ (READY, RUNNING, ฯลฯ)
│   ├── engine.py                      # Simulation Clock loop และการบันทึก Snapshot
│   ├── events.py                      # การสร้าง Event log สรุปแต่ละ Tick
│   ├── metrics.py                     # การคำนวณสถิติและเปรียบเทียบ Delta Metrics
│   ├── analyzer.py                    # Bottleneck Analyzer วินิจฉัยคอขวดและให้คำแนะนำ
│   ├── runner.py                      # ตัวจัดการรันการจำลองและ What-if analysis
│   ├── snapshot.py                    # ตัวจัดรูปแบบ Snapshot ส่งต่อให้ Frontend
│   ├── scheduler/                     # อัลกอริทึมจัดสรร CPU
│   │   ├── base.py                    # BaseScheduler
│   │   ├── fcfs.py                    # First-Come First-Served
│   │   ├── sjf.py                     # Shortest Job First
│   │   ├── round_robin.py             # Round Robin (Time-sliced)
│   │   └── priority.py                # Priority Scheduling
│   ├── memory/                        # การจัดการหน่วยความจำ
│   │   ├── manager.py                 # Page table, Frame table, Page Fault
│   │   ├── replacement.py             # FIFO และ LRU Policies
│   │   └── thrashing.py               # ตัวตรวจจับสภาวะ Thrashing
│   └── io/                            # การจัดการ Disk I/O
│       └── manager.py                 # I/O queue, Transfer time, Device management
│
├── workloads/                         # ชุดข้อมูลงานจำลอง (JSON format)
│   ├── generator.py                   # ตัวสร้าง Workload ตามพารามิเตอร์
│   ├── cpu_heavy.json                 # งานเน้นประมวลผล
│   ├── io_heavy.json                  # งานเน้นดิสก์และไฟล์
│   ├── memory_hog.json                # งานใช้หน่วยความจำเกินขนาด
│   ├── mixed.json                     # งานจำลองสภาพแวดล้อมผสม
│   └── textbook_examples.json         # กรณีศึกษามาตรฐานจากตำรา
│
├── api/                               # ★ FastAPI Backend Layer
│   ├── index.py                       # Serverless Function Entrypoint สำหรับ Vercel
│   ├── main.py                        # FastAPI routes, CORS, Static files mount
│   ├── service.py                     # ฟังก์ชันเชื่อมต่อ API สู่ Simulation Engine
│   ├── schemas.py                     # Pydantic Schemas กำหนด Data Contract
│   └── mock.py                        # Mock data สำหรับทดสอบในโหมด Standalone
│
├── frontend/                          # ★ React + Vite + TypeScript Frontend
│   ├── index.html                     # HTML Template
│   ├── package.json                   # NPM Dependencies
│   ├── vite.config.ts                 # การตั้งค่า Vite และ Reverse Proxy
│   ├── tailwind.config.ts             # การตั้งค่า Tailwind CSS และ Colors Palette
│   └── src/
│       ├── main.tsx                   # React Entrypoint
│       ├── App.tsx                    # หน้าจอแดชบอร์ดหลัก
│       ├── index.css                  # ระบบธีมมืดและ Styling
│       ├── vite-env.d.ts              # Type definitions ของ Vite Environment
│       ├── api/client.ts              # ตัวเรียก API (simulate, compare, workloads)
│       ├── store/useSimStore.ts       # State Management (Zustand)
│       ├── hooks/usePlayback.ts       # ควบคุมเวลาและ Animation Loop
│       ├── lib/colors.ts              # ฟังก์ชันสร้างโทนสีตาม PID และ Status
│       └── components/                # คอมโพเนนต์แสดงผล
│           ├── GanttChart.tsx         # ไทม์ไลน์ Gantt Chart ของกระบวนการ
│           ├── GaugeRow.tsx           # มาตรวัด CPU / RAM / I/O Utilizations
│           ├── QueueLane.tsx          # แอนิเมชันสถานะคิว Ready, Running, IO
│           ├── MemoryGrid.tsx         # ผังแสดงเฟรมใน RAM และ Page Fault
│           ├── UtilizationChart.tsx   # กราฟเส้นแบบ Real-time แสดงความหนาแน่น
│           ├── ProcessTable.tsx       # ตารางสถิติและสถานะแต่ละ Process
│           ├── BottleneckCard.tsx     # การ์ดสรุปคอขวดและคำแนะนำ
│           ├── PlaybackBar.tsx        # แถบควบคุมเวลา Play/Pause/Scrubbing
│           ├── ControlPanel.tsx       # แผงปรับแต่งตัวแปรการทดลอง
│           ├── WhatIfCompare.tsx      # โหมดเปรียบเทียบ A/B Testing
│           ├── CustomWorkloadModal.tsx# หน้าต่างออกแบบ Workload ด้วยตนเอง
│           ├── ScenarioPresetsModal.tsx# เมนูลัดเลือกสถานการณ์ตัวอย่าง
│           ├── ExportReportModal.tsx  # หน้าต่างส่งออกรายงานผล
│           └── GuideModal.tsx         # คู่มือการใช้งานระบบฉบับย่อในตัวเว็บ
│
├── tests/                             # ★ ชุด Unit Test อัตโนมัติ (pytest)
│   ├── test_engine.py
│   ├── test_scheduler.py
│   ├── test_memory.py
│   ├── test_analyzer.py
│   └── test_api.py
│
└── experiments/                       # ★ สคริปต์การทดลองและประเมินผลเชิงลึก
    ├── exp_schedulers.py
    ├── exp_quantum.py
    ├── exp_ram_size.py
    ├── exp_replacement.py
    ├── exp_whatif.py
    ├── plot.py
    └── results/                       # กราฟ PNG และข้อมูลสรุปผล
```

---

## 👥 สมาชิกผู้จัดทำ (Contributors)

| ชื่อ-สกุล | รหัสนักศึกษา | หน้าที่รับผิดชอบ |
|---|:---:|---|
| **ธนดล ปิ่นเงิน** | **670510667** | `sim/` engine, scheduler, memory, analyzer, `api/`, `frontend/`, tests & deployment |

---

## 🗓️ สถานะการพัฒนา (Project Roadmap & Status)

- [x] **ระยะที่ 1: การออกแบบและวางโครงสร้าง** · ตกลง Schema สัญญากลาง, สร้าง Process Model และ Engine FCFS
- [x] **ระยะที่ 2: ระบบจัดการ CPU** · พัฒนา Round Robin, SJF, Priority Scheduler และ Gantt Chart Timeline
- [x] **ระยะที่ 3: ระบบหน่วยความจำและดิสก์** · สร้าง Memory Paging (FIFO/LRU), Thrashing Detector และ I/O Subsystem
- [x] **ระยะที่ 4: Telemetry และ Bottleneck Engine** · สร้าง Utilization Charts, วิเคราะห์คอขวดอัตโนมัติ และคำแนะนำ
- [x] **ระยะที่ 5: What-If Analysis และฟังก์ชันพิเศษ** · โหมดเปรียบเทียบ A/B, ตัวสร้าง Custom Workload และตัวส่งออกรายงาน
- [x] **ระยะที่ 6: การทดสอบและการเผยแพร่** · Automated Unit Tests 100% Pass, รองรับ Vercel และ Docker พร้อมใช้งานสมบูรณ์

---

<div align="center">

**Operating Systems Final Project**  
*Department of Computer Engineering / Computer Science*

</div>
