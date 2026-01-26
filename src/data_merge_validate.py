import sys
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

PROC = Path("data/processed")

USER_COL = "user_id"
TIME_COL = "date_freq"

from src.data_loading import (
    load_tracker_model_ready,
    load_lendingclub_model_ready,
)

# Loading the datasets
def load_model_ready(name: str) -> pd.DataFrame:
    return pd.read_parquet(PROC / f"{name}_model_ready.parquet")


# Extracting from the lending club dataset 
def extract_lendingclub(lc_df: pd.DataFrame) -> dict:
    priors = {}

    if "int_rate" in lc_df.columns:
        priors["lc_avg_interest_rate"] = lc_df["int_rate"].mean()

    if "installment" in lc_df.columns:
        priors["lc_avg_installment"] = lc_df["installment"].mean()

    if "loan_amnt" in lc_df.columns:
        priors["lc_avg_loan_amount"] = lc_df["loan_amnt"].mean()

    return priors

# Aggregating the personal finance tracker dataset
def aggregate_personal_tracker(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df
        .groupby([USER_COL, TIME_COL], as_index=False)
        .agg({
            "monthly_income": "sum",
            "monthly_expense_total": "sum",
            "loan_payment": "sum",
        })
    )


# Validation
def validate(df: pd.DataFrame) -> None:
    assert df.duplicated(subset=[USER_COL, TIME_COL]).sum() == 0, (
        "Duplicate (user_id, date_freq) rows detected"
    )

    sorted_df = df.sort_values([USER_COL, TIME_COL])
    assert sorted_df.index.equals(df.index), (
        "Dataset not sorted by (user_id, date_freq)"
    )

    assert df.isna().sum().sum() == 0, (
        "Missing values detected in unified state"
    )

    print("Validation passed")


# Merge
def run() -> None:
    # Load datasets
    tracker = load_tracker_model_ready()
    lendingclub = load_lendingclub_model_ready()

    # LendingClub
    lc_priors = extract_lendingclub(lendingclub)
    for k, v in lc_priors.items():
        tracker[k] = v

    # Personal Finance Tracker
    tracker = aggregate_personal_tracker(tracker)
    tracker = tracker.sort_values([USER_COL, TIME_COL]).reset_index(drop=True)
    validate(tracker)

    # Save unified state
    outfile = PROC / "unified_financial_state.parquet"
    tracker.to_parquet(outfile, index=False)

    print(f"\nUnified financial state saved → {outfile}")

if __name__ == "__main__":
    run()