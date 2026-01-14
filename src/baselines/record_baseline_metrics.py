import pandas as pd
from pathlib import Path
from datetime import datetime

METRICS_PATH = Path("reports/baselines/baseline_regression_metrics.csv")
BENCHMARK_PATH = Path("reports/baselines/baseline_benchmark.csv")

TASK_TYPE = "regression"
TARGET = "debt_to_income_ratio"
DATASET = "unified_financial_state"
RANDOM_SEED = 42


def main():
    assert METRICS_PATH.exists(), "Baseline metrics file not found."

    df = pd.read_csv(METRICS_PATH)

    df["task_type"] = TASK_TYPE
    df["target"] = TARGET
    df["dataset"] = DATASET
    df["random_seed"] = RANDOM_SEED
    df["timestamp"] = datetime.now().isoformat(timespec="seconds")

    if BENCHMARK_PATH.exists():
        benchmark_df = pd.read_csv(BENCHMARK_PATH)
        df = pd.concat([benchmark_df, df], ignore_index=True)

    df.to_csv(BENCHMARK_PATH, index=False)

    print(f"Baseline benchmark recorded → {BENCHMARK_PATH}")


if __name__ == "__main__":
    main()
