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


# Datasets after encoding
def load_lendingclub_final():
    return pd.read_parquet(PROC / "lendingclub_final.parquet")

def load_finance_final():
    return pd.read_parquet(PROC / "finance_dataset_final.parquet")

def load_tracker_final():
    return pd.read_parquet(PROC / "tracker_dataset_final.parquet")

def load_synthetic_final():
    return pd.read_parquet(PROC / "synthetic_finance_final.parquet")


# Datasets after doing the final model ready checks
def load_lendingclub_model_ready():
    return pd.read_parquet(PROC / "lendingclub_model_ready.parquet")

def load_finance_model_ready():
    return pd.read_parquet(PROC / "finance_dataset_model_ready.parquet")

def load_tracker_model_ready():
    return pd.read_parquet(PROC / "tracker_dataset_model_ready.parquet")

def load_synthetic_model_ready():
    return pd.read_parquet(PROC / "synthetic_finance_model_ready.parquet")