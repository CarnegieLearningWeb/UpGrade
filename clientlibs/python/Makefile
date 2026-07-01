.PHONY: install lint typecheck test build publish clean

install:
	pip install -e ".[dev]"

lint:
	ruff check src tests
	ruff format --check src tests

typecheck:
	mypy src

test:
	pytest

build:
	python -m build

publish:
	twine upload dist/*

clean:
	rm -rf dist build .mypy_cache .ruff_cache .pytest_cache htmlcov
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
