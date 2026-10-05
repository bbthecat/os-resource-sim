# วิธีการ Deploy โปรเจกต์ขึ้น Vercel

โปรเจกต์นี้ได้รับการตั้งค่าไฟล์ [`vercel.json`](file:///d:/final%20osu/os-resource-sim/vercel.json) และ Serverless Function [`api/index.py`](file:///d:/final%20osu/os-resource-sim/api/index.py) ให้รองรับการ Deploy ทั้ง **Frontend (React + Vite)** และ **Backend (FastAPI Python)** ขึ้น Vercel ได้อย่างสมบูรณ์แบบครับ

---

## วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำ - ง่ายที่สุด)

1. **Push โค้ดขึ้น GitHub Repo ของคุณ:**
   ```bash
   git add .
   git commit -m "Configure Vercel full-stack deployment"
   git push origin BB
   ```
   *(หรือ push ไปที่ branch ที่ต้องการใช้งาน เช่น `main`)*

2. **เปิดเว็บ Vercel:**
   * ไปที่ [vercel.com](https://vercel.com) แล้วล็อกอินด้วย GitHub
   * กดปุ่ม **"Add New..."** ➔ **"Project"**
   * เลือก Repository `os-resource-sim` แล้วกด **"Import"**

3. **การตั้งค่า Project บน Vercel:**
   * **Framework Preset:** `Vite` หรือ `Other`
   * **Root Directory:** `./` (ค่าเริ่มต้น)
   * **Build and Output Settings:** ไม่ต้องแก้ไข ระบบจะอ่านค่าจาก [`vercel.json`](file:///d:/final%20osu/os-resource-sim/vercel.json) โดยอัตโนมัติ:
     * Build Command: `cd frontend && npm install && npm run build`
     * Output Directory: `frontend/dist`

4. **กดปุ่ม "Deploy":**
   * ระบบจะ Build ทั้ง Frontend และ Python Serverless Functions ให้อัตโนมัติ พร้อมใช้งานทันที

---

## วิธีที่ 2: Deploy ผ่าน Vercel CLI (รวดเร็วจาก Terminal)

สามารถใช้ `npx vercel` ได้ทันทีโดยไม่ต้องติดตั้งล่วงหน้า:

```bash
npx vercel
```
* หากเป็นการรันครั้งแรก ระบบจะให้ยืนยันการล็อกอินผ่านเบราว์เซอร์
* ตอบคำถามตั้งค่าโปรเจกต์ กด Enter ใช้ค่าเริ่มต้นได้เลย
* เมื่อต้องการ Deploy ขึ้น Production:
  ```bash
  npx vercel --prod
  ```

---

## สรุปโครงสร้างที่ตั้งค่าให้สำหรับ Vercel:

| ไฟล์ | หน้าที่การทำงาน |
| :--- | :--- |
| [`vercel.json`](file:///d:/final%20osu/os-resource-sim/vercel.json) | ตั้งค่าคำสั่ง Build ให้ Frontend และ Route `/api/*` ไปยัง Python Serverless |
| [`api/index.py`](file:///d:/final%20osu/os-resource-sim/api/index.py) | Entrypoint สำหรับ Vercel Python Serverless Function |
| [`requirements.txt`](file:///d:/final%20osu/os-resource-sim/requirements.txt) | ระบุ Dependencies (`fastapi`, `uvicorn`, `pydantic`) ให้ Vercel ติดตั้ง |
| [`frontend/src/api/client.ts`](file:///d:/final%20osu/os-resource-sim/frontend/src/api/client.ts) | รองรับทั้ง Same-origin `/api` และ External `VITE_API_URL` |
