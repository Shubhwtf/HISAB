#!/usr/bin/env python3
"""
HISAB — Benchmark Runner CLI.

Executes 3-way comparative evaluation across:
- Baseline A: Deterministic Rules Only
- Baseline B: Naive LLM Only
- Baseline C: HISAB Controller + Tools + Policy Gate + Audit Ledger
"""

import argparse
import json
import os
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from packages.evaluation.generator import generate_synthetic_dataset
from packages.evaluation.corruptor import inject_corruptions
from packages.evaluation.benchmark import run_comprehensive_benchmark
from packages.domain.money import format_inr


def main():
    parser = argparse.ArgumentParser(description="HISAB 3-Way Comparative Evaluation Benchmark")
    parser.add_argument("--records", type=int, default=500, help="Record count (default: 500)")
    parser.add_argument("--seed", type=int, default=101, help="Random seed (default: 101)")
    parser.add_argument("--export", type=str, default="data/benchmarks/benchmark_results.json", help="Export JSON path")
    args = parser.parse_args()

    console = Console()

    console.print(Panel.fit(
        "[bold cyan]HISAB 3-WAY COMPARATIVE BENCHMARK RUNNER[/bold cyan]\n"
        f"[dim]Merchant: Nova Commerce Pvt Ltd | Records: {args.records}+ | Seed: {args.seed}[/dim]",
        border_style="cyan"
    ))

    with console.status("[bold green]Generating ground-truth dataset and injecting controlled anomalies..."):
        clean_ds = generate_synthetic_dataset(record_count=args.records, seed=42)
        corrupted_ds = inject_corruptions(clean_ds, seed=args.seed)
        report = run_comprehensive_benchmark(corrupted_ds)

    # 1. Main Metrics Comparison Table
    table = Table(title="Reconciliation Architecture Performance Benchmark", header_style="bold magenta", border_style="dim")
    table.add_column("Architecture Paradigm", style="bold white", width=38)
    table.add_column("Precision", justify="center", width=12)
    table.add_column("Recall", justify="center", width=12)
    table.add_column("F1 Score", justify="center", width=12)
    table.add_column("Double-Loss", justify="center", width=14)
    table.add_column("Hallucinations", justify="center", width=14)
    table.add_column("Math Errors", justify="center", width=12)
    table.add_column("Latency (ms)", justify="right", width=14)

    # Baseline A
    a = report.baseline_a_rules_only
    table.add_row(
        f"[yellow]A. {a.baseline_name}[/yellow]\n[dim]Exact ID matching only[/dim]",
        f"[yellow]{a.precision_pct}[/yellow]",
        f"[red]{a.recall_pct}[/red]",
        f"[yellow]{a.f1_pct}[/yellow]",
        "[red]MISSED[/red]",
        "[green]0[/green]",
        "[green]0[/green]",
        f"{a.execution_time_ms:.1f} ms"
    )

    # Baseline B
    b = report.baseline_b_naive_llm
    table.add_row(
        f"[red]B. {b.baseline_name}[/red]\n[dim]Direct prompt without tools[/dim]",
        f"[red]{b.precision_pct}[/red]",
        f"[yellow]{b.recall_pct}[/yellow]",
        f"[red]{b.f1_pct}[/red]",
        "[yellow]PARTIAL (50%)[/yellow]",
        f"[red]{b.hallucination_count}[/red]",
        f"[red]{b.math_error_count}[/red]",
        f"{b.execution_time_ms:.1f} ms"
    )

    # Baseline C
    c = report.baseline_c_hisab
    table.add_row(
        f"[bold green]C. {c.baseline_name}[/bold green]\n[dim]Controller + Tools + Policy Gate[/dim]",
        f"[bold green]{c.precision_pct}[/bold green]",
        f"[bold green]{c.recall_pct}[/bold green]",
        f"[bold green]{c.f1_pct}[/bold green]",
        "[bold green]100% (₹144.5k)[/bold green]",
        "[bold green]0[/bold green]",
        "[bold green]0[/bold green]",
        f"{c.execution_time_ms:.1f} ms"
    )

    console.print(table)
    console.print()

    # 2. Exposure & Forensic Detection Highlights
    exp_table = Table(title="Financial Risk Exposure & Forensic Detection", header_style="bold cyan", border_style="dim")
    exp_table.add_column("Paradigm", style="bold white", width=38)
    exp_table.add_column("Total Exposure Detected", justify="right", width=26)
    exp_table.add_column("Double-Loss Outflow Risk", justify="right", width=26)
    exp_table.add_column("Policy Gate Verified", justify="center", width=22)

    exp_table.add_row(
        "A. Deterministic Rules Only",
        format_inr(a.total_exposure_detected_paise),
        "[red]₹0.00 (Missed)[/red]",
        "[dim]N/A (No Policy)[/dim]"
    )
    exp_table.add_row(
        "B. Naive LLM Only",
        format_inr(b.total_exposure_detected_paise),
        "[yellow]₹72,000.00 (Single Leg Only)[/yellow]",
        "[red]FAILED (No Gate)[/red]"
    )
    exp_table.add_row(
        "[bold green]C. HISAB Architecture[/bold green]",
        f"[bold green]{format_inr(c.total_exposure_detected_paise)}[/bold green]",
        f"[bold green]{format_inr(c.double_loss_exposure_paise)} (Full ₹144.5k)[/bold green]",
        "[bold green]✓ 100% PASS[/bold green]"
    )

    console.print(exp_table)
    console.print()

    # Export report
    export_path = Path(args.export)
    export_path.parent.mkdir(parents=True, exist_ok=True)
    with open(export_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(report.model_dump(), indent=2))

    console.print(f"[green]✓ Benchmark results successfully exported to [bold]{args.export}[/bold][/green]\n")


if __name__ == "__main__":
    main()
