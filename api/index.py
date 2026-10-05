import os
import sys

# Ensure root directory is added to sys.path so sim, workloads, and api packages can be imported
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from api.main import app

# Vercel Serverless Function expects 'app'
__all__ = ["app"]
