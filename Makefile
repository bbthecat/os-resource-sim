.PHONY: dev test build experiments

dev:
	uvicorn api.main:app --reload --port 8000

test:
	pytest -q

build:
	cd frontend && npm run build

experiments:
	python -m experiments.exp_quantum
	python -m experiments.exp_ram_size
	python -m experiments.exp_replacement
	python -m experiments.exp_whatif
	python -m experiments.exp_schedulers
	python -m experiments.plot
