# os-resource-sim

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
