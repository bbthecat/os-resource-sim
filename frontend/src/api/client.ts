import { SimConfig, SimResult } from '../types/sim';

export interface CompareResult {
  result_a: SimResult;
  result_b: SimResult;
  delta_metrics: Record<string, {
    a: number;
    b: number;
    delta: number;
    pct: number | null;
    better: boolean | null;
  }>;
}

async function parseResponse<T>(res: Response, fallbackErrMsg: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errorDetail = '';
    try {
      if (contentType.includes('application/json')) {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } else {
        errorDetail = await res.text();
      }
    } catch {
      errorDetail = res.statusText;
    }

    if (res.status === 500 || res.status === 502 || res.status === 504 || errorDetail.includes('Internal Server Error')) {
      throw new Error(
        `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้ (HTTP ${res.status}): กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Backend รันอยู่หรือไม่ (เปิดเทอร์มินัลรัน: uvicorn api.main:app --reload --port 8000)`
      );
    }
    throw new Error(`${fallbackErrMsg}: ${errorDetail || res.statusText}`);
  }

  try {
    return await res.json();
  } catch (e: any) {
    throw new Error(`รูปแบบข้อมูลที่ได้รับจากเซิร์ฟเวอร์ไม่ถูกต้อง (${e?.message || 'Invalid JSON'})`);
  }
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchWorkloads(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/workloads`);
    return await parseResponse<string[]>(res, 'ไม่สามารถโหลดรายการ Workload ได้');
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณารันเซิร์ฟเวอร์ uvicorn api.main:app --port 8000');
    }
    throw err;
  }
}

export async function runSimulation(config: SimConfig): Promise<SimResult> {
  try {
    const res = await fetch(`${API_BASE}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await parseResponse<SimResult>(res, 'เกิดข้อผิดพลาดในการรัน Simulation');
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณารันเซิร์ฟเวอร์ uvicorn api.main:app --port 8000');
    }
    throw err;
  }
}

export async function compareSimulations(config_a: SimConfig, config_b: SimConfig): Promise<CompareResult> {
  try {
    const res = await fetch(`${API_BASE}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_a, config_b }),
    });
    return await parseResponse<CompareResult>(res, 'เกิดข้อผิดพลาดในการคำนวณเปรียบเทียบผลลัพธ์ A/B');
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณารันเซิร์ฟเวอร์ uvicorn api.main:app --port 8000');
    }
    throw err;
  }
}
