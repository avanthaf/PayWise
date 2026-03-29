import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from src.data_loading import (
    load_lendingclub_clean,
    load_finance_clean,
    load_tracker_clean,
    load_synthetic_clean,
)

import pandas as pd
import numpy as np

PROC = Path("data/processed")

# Selecting only the columns with numbers
def get_numeric_columns(df):
    return df.select_dtypes(include="number").columns.tolist()


# IQR
def detect_iqr_outliers(series, factor=1.5):
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1

    lower = q1 - factor * iqr
    upper = q3 + factor * iqr

    return (series < lower) | (series > upper), lower, upper


# Z-score
def detect_zscore_outliers(series, threshold=3.0):
    mean = series.mean()
    standard = series.std()

    if standard == 0 or pd.isna(standard):
        return pd.Series(False, index=series.index)

    z = (series - mean) / standard
    return z.abs() > threshold


# Handling the outliers
def handle_outliers(df, dataset_name):
    df = df.copy()
    numeric_cols = get_numeric_columns(df)

    outlier_flags = {}

    for col in numeric_cols:
        series = df[col]

        if series.isna().all() or series.nunique() <= 1:
            continue

        df[col] = series.astype(float)

        # IQR detection
        iqr_mask, lower, upper = detect_iqr_outliers(df[col])

        # Z-score detection
        z_mask = detect_zscore_outliers(df[col])

        # Combine
        outlier_mask = iqr_mask | z_mask

        outlier_flags[f"outlier_{col}"] = outlier_mask.astype(int)

        # Winsorize
        df.loc[df[col] < lower, col] = lower
        df.loc[df[col] > upper, col] = upper

    if outlier_flags:
        df = pd.concat([df, pd.DataFrame(outlier_flags)], axis=1)

    return df


# Processing outliers for all datasets
def process_dataset(load_fn, name):
    print(f"Processing outliers for {name}...")

    df = load_fn()
    df = handle_outliers(df, name)

    outfile = PROC / f"{name}_outliers_handled.parquet"
    df.to_parquet(outfile, index=False)

    print(f"Saved outlier-handled dataset → {outfile}")


def run_all():
    process_dataset(load_lendingclub_clean, "lendingclub")
    process_dataset(load_finance_clean, "finance_dataset")
    process_dataset(load_tracker_clean, "tracker_dataset")
    process_dataset(load_synthetic_clean, "synthetic_finance")

    print("\nAll outlier-handled datasets created successfully.")


if __name__ == "__main__":
    run_all()
