import sys
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from src.data_loading import (
    load_lendingclub_final,
    load_finance_final,
    load_tracker_final,
    load_synthetic_final,
)

PROC = Path("data/processed")
SCALER_DIR = Path("artifacts/scalers")
SCALER_DIR.mkdir(parents=True, exist_ok=True)


# Splitting to numeric and non-numeric to handle any missing values and normalize them to get the data ready
def split_columns(df):
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()
    return numeric_cols, categorical_cols


# Handling missing values on numeric columns
def handle_missing_values(df):
    numeric_cols = df.select_dtypes(include="number").columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    return df


# Normalizing numeric features
def normalize_numeric_features(df, dataset_name):
    num_cols = df.select_dtypes(include="number").columns

    scaler = StandardScaler()
    df[num_cols] = scaler.fit_transform(df[num_cols])

    joblib.dump(
        scaler,
        SCALER_DIR / f"{dataset_name}_scaler.joblib"
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
    process_dataset(load_lendingclub_final, "lendingclub")
    process_dataset(load_finance_final, "finance_dataset")
    process_dataset(load_tracker_final, "tracker_dataset")
    process_dataset(load_synthetic_final, "synthetic_finance")

    print("\nAll model-ready datasets created successfully.")

if __name__ == "__main__":
    run_all()