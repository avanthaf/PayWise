import pandas as pd
from pathlib import Path

PROC = Path("data/processed")

# Datasets after preprocessing
def load_lendingclub_clean():
    return pd.read_parquet(PROC / "lendingclub_clean.parquet")

def load_finance_clean():
    return pd.read_parquet(PROC / "finance_dataset_clean.parquet")

def load_tracker_clean():
    return pd.read_parquet(PROC / "tracker_dataset_clean.parquet")

def load_synthetic_clean():
    return pd.read_parquet(PROC / "synthetic_finance_clean.parquet")


# Datasets after handling outliers
def load_lendingclub_outliers():
    return pd.read_parquet(PROC / "lendingclub_outliers_handled.parquet")

def load_finance_outliers():
    return pd.read_parquet(PROC / "finance_dataset_outliers_handled.parquet")

def load_tracker_outliers():
    return pd.read_parquet(PROC / "tracker_dataset_outliers_handled.parquet")

def load_synthetic_outliers():
    return pd.read_parquet(PROC / "synthetic_finance_outliers_handled.parquet")