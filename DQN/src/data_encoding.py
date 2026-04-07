# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

import sys
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import OneHotEncoder
import joblib

PROC = Path("data/processed")
ENCODER_DIR = Path("artifacts/encoders")
ENCODER_DIR.mkdir(parents=True, exist_ok=True)

from src.data_loading import (
    load_lendingclub_outliers,
    load_finance_outliers,
    load_tracker_outliers,
    load_synthetic_outliers,
)

def split_columns(df):
    numeric_cols = df.select_dtypes(include="number").columns.tolist() # Numeric columns
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist() # Non-numeric columns
    return numeric_cols, categorical_cols


# Encoding categorical features
def encode_categorical_features(df, dataset_name, max_ohe_categories=20):
    df = df.copy()
    _, cat_cols = split_columns(df)

    low_card_cols = []
    high_card_cols = []

    for col in cat_cols: # Split by cardinality
        n_unique = df[col].nunique(dropna=True)
        if n_unique <= max_ohe_categories:
            low_card_cols.append(col)
        else:
            high_card_cols.append(col)

    if low_card_cols: # One-Hot Encoding (Low Cardinality)
        encoder = OneHotEncoder(
            sparse_output=False,
            handle_unknown="ignore"
        )

        encoded = encoder.fit_transform(df[low_card_cols])
        encoded_df = pd.DataFrame(
            encoded,
            columns=encoder.get_feature_names_out(low_card_cols),
            index=df.index
        )

        joblib.dump(
            encoder,
            ENCODER_DIR / f"{dataset_name}_ohe.joblib"
        )

        df = df.drop(columns=low_card_cols)
        df = pd.concat([df, encoded_df], axis=1)

    for col in high_card_cols: # One-Hot Encoding (High Cardinality)
        freq = df[col].value_counts(normalize=True)
        df[f"{col}_freq"] = df[col].map(freq)
        df = df.drop(columns=[col])

    print(
        f"{dataset_name}: "
        f"OHE={len(low_card_cols)}, "
        f"FreqEnc={len(high_card_cols)}"
    )

    return df

def process_dataset(load_fn, name):
    print(f"Encoding features for {name}...")

    df = load_fn()
    df = encode_categorical_features(df, name)

    outfile = PROC / f"{name}_final.parquet"
    df.to_parquet(outfile, index=False)

    print(f"Saved final dataset → {outfile}")

def run_all():
    process_dataset(load_lendingclub_outliers, "lendingclub")
    process_dataset(load_finance_outliers, "finance_dataset")
    process_dataset(load_tracker_outliers, "tracker_dataset")
    process_dataset(load_synthetic_outliers, "synthetic_finance")

    print("\nAll final datasets created successfully.")

if __name__ == "__main__":
    run_all()