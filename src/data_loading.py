import pandas as pd
from pathlib import Path

PROC = Path("data/processed")

def load_lending_club():
    return pd.read_parquet(PROC / "lendingclub_clean.parquet")

def load_finance_dataset():
    return pd.read_parquet(PROC / "finance_dataset_clean.parquet")

def load_tracker_dataset():
    return pd.read_parquet(PROC / "tracker_dataset_clean.parquet")

def load_synthetic_dataset():
    return pd.read_parquet(PROC / "synthetic_finance_clean.parquet")