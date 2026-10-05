.PHONY: dev test build experiments

dev:
	uvicorn api.main:app --reload --port 8000

test:
	pytest -q

build:
	cd frontend && npm run build

experiments:
	python -m experiments.exp_quantum
