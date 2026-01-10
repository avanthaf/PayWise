import sys
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from src.data_loading import (
    load_lending_club,
    load_finance_dataset,
    load_tracker_dataset,
    load_synthetic_dataset,
)

PROC = Path("data/processed")
SCALER_DIR = Path("artifacts/scalers")
SCALER_DIR.mkdir(parents=True, exist_ok=True)

def split_columns(df):
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()
    return numeric_cols, categorical_cols

def handle_missing_values(df):
    num_cols, cat_cols = split_columns(df)

    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())

    for col in cat_cols:
        df[col] = df[col].fillna("unknown")

    return df

def normalize_numeric_features(df, dataset_name):
    num_cols, _ = split_columns(df)

    rate_cols = [c for c in num_cols if "rate" in c or "interest" in c]
    value_cols = [c for c in num_cols if c not in rate_cols]

    scalers = {}

    if value_cols:
        scaler_val = StandardScaler()
        df[value_cols] = scaler_val.fit_transform(df[value_cols])
        scalers["value_scaler"] = scaler_val

    if rate_cols:
        scaler_rate = MinMaxScaler()
        df[rate_cols] = scaler_rate.fit_transform(df[rate_cols])
        scalers["rate_scaler"] = scaler_rate

    for name, scaler in scalers.items():
        joblib.dump(
            scaler,
            SCALER_DIR / f"{dataset_name}_{name}.joblib"
        )

    return df

# Dataset pipelines
# -----------------------------
def process_dataset(load_fn, name):
    print(f"Processing {name}...")

    df = load_fn()
    df = handle_missing_values(df)
    df = normalize_numeric_features(df, name)

    outfile = PROC / f"{name}_model_ready.parquet"
    df.to_parquet(outfile, index=False)

    print(f"Saved model-ready dataset → {outfile}")

def run_all():
    process_dataset(load_lending_club, "lendingclub")
    process_dataset(load_finance_dataset, "finance_dataset")
    process_dataset(load_tracker_dataset, "tracker_dataset")
    process_dataset(load_synthetic_dataset, "synthetic_finance")

    print("\nAll model-ready datasets created successfully.")

if __name__ == "__main__":
    run_all()