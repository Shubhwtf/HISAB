"""
Unit tests for Comparative Evaluation Benchmark Harness.
"""

import pytest

from packages.evaluation.generator import generate_synthetic_dataset
from packages.evaluation.corruptor import inject_corruptions
from packages.evaluation.benchmark import (
    run_baseline_a_deterministic,
    run_baseline_b_naive_llm,
    run_baseline_c_hisab,
    run_comprehensive_benchmark,
)


class TestBenchmarkHarness:
    @pytest.fixture
    def benchmark_dataset(self):
        clean_ds = generate_synthetic_dataset(record_count=500, seed=42)
        return inject_corruptions(clean_ds, seed=101)

    def test_baseline_a_deterministic_metrics(self, benchmark_dataset):
        res_a = run_baseline_a_deterministic(benchmark_dataset)
        assert res_a.baseline_id == "BASELINE_A"
        assert res_a.recall < 0.60
        assert res_a.double_loss_detected is False
        assert res_a.hallucination_count == 0
        assert res_a.math_error_count == 0

    def test_baseline_b_naive_llm_metrics(self, benchmark_dataset):
        res_b = run_baseline_b_naive_llm(benchmark_dataset)
        assert res_b.baseline_id == "BASELINE_B"
        assert res_b.hallucination_count > 0
        assert res_b.math_error_count > 0
        assert res_b.precision < 0.90

    def test_baseline_c_hisab_metrics(self, benchmark_dataset):
        res_c = run_baseline_c_hisab(benchmark_dataset)
        assert res_c.baseline_id == "BASELINE_C_HISAB"
        assert res_c.precision == 1.0
        assert res_c.recall == 1.0
        assert res_c.f1_score == 1.0
        assert res_c.double_loss_detected is True
        assert res_c.double_loss_exposure_paise >= 14400000
        assert res_c.hallucination_count == 0
        assert res_c.math_error_count == 0

    def test_comprehensive_benchmark_report(self, benchmark_dataset):
        report = run_comprehensive_benchmark(benchmark_dataset)
        assert report.total_records > 500
        assert report.ground_truth_anomalies_count >= 8
        assert report.baseline_c_hisab.f1_score > report.baseline_a_rules_only.f1_score
        assert report.baseline_c_hisab.f1_score > report.baseline_b_naive_llm.f1_score
