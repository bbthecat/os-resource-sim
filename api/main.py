import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.schemas import SimConfigModel, SimResultModel, CompareRequestModel, CompareResultModel
import api.mock as mock

try:
    import api.service as service
    SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: api.service could not be loaded ({e}). Forcing USE_MOCK=True")
    SERVICE_AVAILABLE = False

app = FastAPI(title="OS Resource Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true" or not SERVICE_AVAILABLE

@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "service": "os-resource-sim-api"}

@app.get("/api/workloads")
@app.get("/workloads")
def get_workloads():
    if USE_MOCK:
        return mock.get_mock_workloads()
    return service.get_workloads()

@app.post("/api/simulate", response_model=SimResultModel)
@app.post("/simulate", response_model=SimResultModel)
def simulate(config: SimConfigModel):
    if USE_MOCK:
        return mock.mock_simulate(config)
    return service.simulate(config)

@app.post("/api/compare", response_model=CompareResultModel)
@app.post("/compare", response_model=CompareResultModel)
def compare(request: CompareRequestModel):
    if USE_MOCK:
        # Mock not fully implemented for compare, returning basic
        mock_a = mock.mock_simulate(request.config_a)
        mock_b = mock.mock_simulate(request.config_b)
        return {
            "result_a": mock_a,
            "result_b": mock_b,
            "delta_metrics": {}
        }
    return service.compare(request.config_a, request.config_b)

from pathlib import Path

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

