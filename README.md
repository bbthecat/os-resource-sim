# OS Resource Manager Simulator (sim core)

จำลอง CPU + RAM + Disk I/O ในระบบเดียว แล้ววินิจฉัยคอขวด (Bottleneck Analyzer) และเทียบ What-if

## รัน
```
pip install pytest
python -m pytest -q                              # เทสทั้งหมด
python run_demo.py                               # รันทุก workload + วินิจฉัย
python run_demo.py memory_hog.json --whatif      # thrashing -> เพิ่ม RAM -> เทียบก่อน/หลัง
python run_demo.py mixed.json --gantt --json out.json
python -m workloads.generator                    # สร้างไฟล์ workload ใหม่ (seed คงที่)
```

## โครงสร้าง
```
sim/
  config.py     SimConfig (scheduler, quantum, ram_frames, replacement, disk_service_time, aging_interval, seed)
  process.py    Process (PCB), State, โมเดลการเข้าถึง page (locality)
  engine.py     Simulation: tick loop + snapshot, SimResult
  events.py     format ของ event "ชื่อ:pid"
  snapshot.py   สัญญากับ UI (ดูรายการ key ในไฟล์)
  scheduler/    base, fcfs, round_robin, priority (preemptive + aging)
  memory/       manager (frame/page table), replacement (FIFO/LRU), thrashing (online detector)
  io/           manager (disk เดียว คิว FIFO; คำขอ "io" และ "page")
  metrics.py    waiting/turnaround/response, util, fault rate, fairness (Jain), compare_metrics
  analyzer.py   Bottleneck Analyzer (THRESHOLDS + กฎวินิจฉัย + suggested_config)
  runner.py     run_simulation / run_compare / run_whatif / gantt_text / gantt_segments
workloads/      loader + generator + cpu_heavy / io_heavy / memory_hog / mixed / textbook_examples
tests/          scheduler, memory, engine, snapshot, analyzer
```

## กติกาของโมเดล (ควรเขียนในรายงาน)
- 1 tick: admit -> io_tick -> preempt/pick -> wait+aging -> run -> snapshot
- process ที่รันบน CPU เข้าถึง 1 page ต่อ tick; 80% เข้าซ้ำ 3 หน้าล่าสุด, 20% สุ่ม (LOCALITY ใน process.py)
- ลำดับ page ของแต่ละ process ใช้ rng ของตัวเอง (seed + pid) จึงไม่ขึ้นกับ scheduler/RAM -> What-if เทียบแฟร์
- page fault: process -> WAITING_MEM, ไม่กิน CPU ใน tick นั้น, disk ใช้ disk_service_time tick, เสร็จแล้วกลับ READY แล้วเข้าถึง page เดิมซ้ำ
- I/O burst ใช้ disk ตัวเดียวกับ page fault (คิว FIFO, ทีละคำขอ)
- page replacement เป็นแบบ global (เตะ frame ของ process ไหนก็ได้)
- priority: เลขน้อย = สำคัญกว่า
