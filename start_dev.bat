@echo off
echo ===================================================
echo  Starting OS Resource Manager Simulator (Dev Mode)
echo ===================================================
echo [1/2] Launching Backend API (FastAPI / Uvicorn on :8000)...
start "OS Sim Backend" cmd /k "python -m uvicorn api.main:app --reload --port 8000"

echo [2/2] Launching Frontend (Vite on :5173)...
cd frontend
call npm run dev
