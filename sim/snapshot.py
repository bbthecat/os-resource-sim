# snapshot.py: 1 dict ต่อ tick (ตกลงกับคนทำ UI ตอนนี้ เปลี่ยนทีหลังยาก)
{
  "t": 7,
  "running": 2,                     # pid หรือ None
  "ready": [1, 3],
  "waiting_io": [4],
  "waiting_mem": [5],
  "frames": [2, 2, 1, None, ...],   # เจ้าของแต่ละ frame (pid หรือ None)
  "disk_busy": True,
  "events": ["page_fault:5", "evict:2"],
  "cpu_busy": True
}