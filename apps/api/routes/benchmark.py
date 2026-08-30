"""
HISAB — Evaluation Benchmark API Endpoints.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db
from packages.evaluation.generator import generate_synthetic_dataset
from packages.evaluation.corruptor import inject_corruptions
from packages.evaluation.benchmark import run_comprehensive_benchmark

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])

BENCHMARK_FILE = Path("data/benchmarks/benchmark_results.json")


class BenchmarkRunRequest(BaseModel):
    records_count: int = 500
    seed: int = 101


@router.get("/latest")
def get_latest_benchmark():
    """
    Returns the latest 3-way comparative benchmark report from disk or generates a fresh one.
    """
    if BENCHMARK_FILE.exists():
        try:
            with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Generate on the fly
    clean_ds = generate_synthetic_dataset(record_count=500, seed=42)
    corrupted_ds = inject_corruptions(clean_ds, seed=101)
    report = run_comprehensive_benchmark(corrupted_ds)
    return report.model_dump()


@router.post("/run")
def trigger_benchmark(req: BenchmarkRunRequest):
    """
    Executes a fresh live comparative benchmark run across Baseline A, Baseline B, and Baseline C.
    """
    clean_ds = generate_synthetic_dataset(record_count=req.records_count, seed=42)
    corrupted_ds = inject_corruptions(clean_ds, seed=req.seed)
    report = run_comprehensive_benchmark(corrupted_ds)

    BENCHMARK_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BENCHMARK_FILE, "w", encoding="utf-8") as f:
        f.write(json.dumps(report.model_dump(), indent=2))

    return report.model_dump()
