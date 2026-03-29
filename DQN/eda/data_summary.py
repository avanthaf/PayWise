import sys
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from src.data_loading import (
    load_lending_club,
    load_finance_dataset,
    load_tracker_dataset,
    load_synthetic_dataset,
)

sns.set_theme(style="whitegrid")

REPORT_DIR = Path("reports/eda")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

def plot_numeric_distributions(df, outdir, prefix):
    numeric_cols = df.select_dtypes(include="number").columns

    for col in numeric_cols:
        plt.figure(figsize=(6, 4))
        sns.histplot(df[col].dropna(), kde=True, bins=30)
        plt.title(f"{prefix} | Distribution of {col}")
        plt.tight_layout()
        plt.savefig(outdir / f"{prefix}_hist_{col}.png")
        plt.close()

def plot_boxplots(df, outdir, prefix):
    numeric_cols = df.select_dtypes(include="number").columns

    for col in numeric_cols:
        data = df[col].dropna()

        if data.nunique() <= 1:
            continue

        plt.figure(figsize=(6, 4))
        plt.boxplot(data, vert=False)
        plt.title(f"{prefix} | Boxplot of {col}")
        plt.tight_layout()
        plt.savefig(outdir / f"{prefix}_box_{col}.png")
        plt.close()


def plot_correlation_heatmap(df, outdir, prefix):
    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] < 2:
        return

    plt.figure(figsize=(10, 8))
    sns.heatmap(
        numeric_df.corr(),
        cmap="coolwarm",
        center=0,
        linewidths=0.5
    )
    plt.title(f"{prefix} | Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(outdir / f"{prefix}_correlation_heatmap.png")
    plt.close()

def run_basic_eda(df, name):
    outdir = REPORT_DIR / name
    outdir.mkdir(parents=True, exist_ok=True)

    print(f"Running EDA for {name}...")

    plot_numeric_distributions(df, outdir, name)
    plot_boxplots(df, outdir, name)
    plot_correlation_heatmap(df, outdir, name)

    print(f"EDA completed for {name}")

# Dataset-specific EDA
# -----------------------------
def eda_lendingclub():
    df = load_lending_club()
    run_basic_eda(df, "lendingclub")

def eda_finance():
    df = load_finance_dataset()
    run_basic_eda(df, "finance")

def eda_synthetic():
    df = load_synthetic_dataset()
    run_basic_eda(df, "synthetic")

def eda_tracker():
    df = load_tracker_dataset()
    run_basic_eda(df, "tracker")

    if "date" in df.columns:
        numeric_cols = df.select_dtypes(include="number").columns

        for col in numeric_cols:
            plt.figure(figsize=(10, 4))
            df.groupby("date")[col].mean().plot()
            plt.title(f"tracker | Time Series of {col}")
            plt.tight_layout()
            plt.savefig(REPORT_DIR / "tracker" / f"tracker_timeseries_{col}.png")
            plt.close()

if __name__ == "__main__":
    eda_lendingclub()
    eda_finance()
    eda_tracker()
    eda_synthetic()

    print("\nAll EDA reports generated successfully.")