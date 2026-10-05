# System Design

## Architecture
The system is divided into three layers:
1. **Frontend (React)**: Handles the UI, playback, and rendering of the simulation data.
2. **API (FastAPI)**: A thin middle layer that connects the frontend to the simulation engine.
3. **Core (Python)**: The core engine located in `sim/` which handles discrete-event simulation of the CPU, Memory, and I/O.

## Data Flow
The frontend sends a `SimConfig` to the API.
The API triggers the core engine.
The core engine simulates the workload and returns a single `SimResult` containing a list of snapshots.
The frontend uses the snapshots to drive the playback animations.
