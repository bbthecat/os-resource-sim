import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.schemas import SimConfigModel, SimResultModel, CompareRequestModel, CompareResultModel
import api.service as service
import api.mock as mock

app = FastAPI(title="OS Resource Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"

@app.get("/api/workloads")
def get_workloads():
    if USE_MOCK:
        return mock.get_mock_workloads()
    return service.get_workloads()

@app.post("/api/simulate", response_model=SimResultModel)
def simulate(config: SimConfigModel):
    if USE_MOCK:
        return mock.mock_simulate(config)
    return service.simulate(config)

@app.post("/api/compare", response_model=CompareResultModel)
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

# Optional: Mount frontend/dist if we want to serve everything from FastAPI
# if os.path.exists("../frontend/dist"):
#     app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")
