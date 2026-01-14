import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

BENCHMARK_PATH = Path("reports/baselines/baseline_benchmark.csv")
PLOT_DIR = Path("reports/baselines/plots")
PLOT_DIR.mkdir(parents=True, exist_ok=True)


def load_benchmarks():
    assert BENCHMARK_PATH.exists(), "Benchmark file not found."
    return pd.read_csv(BENCHMARK_PATH)


def plot_metric(df, metric, ylabel):
    plt.figure(figsize=(6, 4))
    plt.bar(df["model"], df[metric])
    plt.ylabel(ylabel)
    plt.xlabel("Model")
    plt.title(f"Baseline Model Comparison ({metric})")
    plt.tight_layout()

    outpath = PLOT_DIR / f"baseline_{metric.lower()}.png"
    plt.savefig(outpath)
    plt.close()

    print(f"Saved plot → {outpath}")


def main():
    df = load_benchmarks()
    df = df.sort_values("timestamp").groupby("model").tail(1)

    plot_metric(df, "MAE", "Mean Absolute Error")
    plot_metric(df, "RMSE", "Root Mean Squared Error")
    plot_metric(df, "R2", "R² Score")


if __name__ == "__main__":
    main()
