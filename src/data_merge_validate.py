import sys
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

PROC = Path("data/processed")

USER_COL = "user_id"
TIME_COL = "date_freq"


def load_final(name: str) -> pd.DataFrame:
    return pd.read_parquet(PROC / f"{name}_final.parquet")


def extract_finance_context(finance_df: pd.DataFrame) -> dict:
    context = {}

    if "loan_application_summary_loan_amount" in finance_df.columns:
        context["finance_avg_loan_amount"] = (
            finance_df["loan_application_summary_loan_amount"].mean()
        )

    if "loan_application_summary_interest_rate" in finance_df.columns:
        context["finance_avg_interest_rate"] = (
            finance_df["loan_application_summary_interest_rate"].mean()
        )

    if "loan_application_summary_loan_term" in finance_df.columns:
        context["finance_avg_loan_term"] = (
            finance_df["loan_application_summary_loan_term"].mean()
        )

    risk_cols = [c for c in finance_df.columns if "risk_tolerance" in c]
    if risk_cols:
        context["finance_population_risk_tolerance"] = (
            finance_df[risk_cols].mean().max()
        )

    activity_cols = [
        c for c in finance_df.columns if c.startswith("account_activity_")]
    if activity_cols:
        context["finance_avg_account_activity"] = (
            finance_df[activity_cols].mean().mean()
        )

    freq_cols = [c for c in finance_df.columns if c.endswith("_freq")]
    if freq_cols:
        context["finance_avg_transaction_frequency"] = (
            finance_df[freq_cols].mean().mean()
        )

    return context


def extract_lendingclub_priors(lc_df: pd.DataFrame) -> dict:
    priors = {}

    if "int_rate" in lc_df.columns:
        priors["lc_avg_interest_rate"] = lc_df["int_rate"].mean()

    if "installment" in lc_df.columns:
        priors["lc_avg_installment"] = lc_df["installment"].mean()

    risk_cols = [
        c for c in [
            "dti",
            "dti_joint",
            "delinq_2yrs",
            "acc_now_delinq",
            "pub_rec_bankruptcies",
            "chargeoff_within_12_mths",
        ]
        if c in lc_df.columns
    ]
    if risk_cols:
        priors["lc_risk_index"] = lc_df[risk_cols].mean().mean()

    util_cols = [
        c for c in [
            "revol_util",
            "bc_util",
            "percent_bc_gt_75",
            "all_util",
        ]
        if c in lc_df.columns
    ]
    if util_cols:
        priors["lc_utilisation_index"] = lc_df[util_cols].mean().mean()

    hardship_cols = [
        c for c in lc_df.columns if c.startswith("hardship_flag_")]
    if hardship_cols:
        priors["lc_hardship_rate"] = lc_df[hardship_cols].mean().max()

    loan_status_cols = [
        c for c in lc_df.columns if c.startswith("loan_status_")]
    if loan_status_cols:
        priors["lc_default_pressure"] = lc_df[loan_status_cols].mean().max()

    return priors


def aggregate_tracker_states(df: pd.DataFrame) -> pd.DataFrame:
    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    agg_map = {}

    for col in numeric_cols:
        if any(k in col for k in ["rate", "ratio", "score", "index"]):
            agg_map[col] = "mean"
        elif any(k in col for k in ["flag", "_Yes", "_No", "_High", "_Low", "_Medium"]):
            agg_map[col] = "max"
        elif any(k in col for k in ["count", "total", "amount", "payment", "income", "expense"]):
            agg_map[col] = "sum"
        else:
            agg_map[col] = "mean"

    return (
        df
        .groupby([USER_COL, TIME_COL], as_index=False)
        .agg(agg_map)
    )


# Validation
# -------------------------------------------------
def validate_unified_state(df: pd.DataFrame) -> None:
    assert df.duplicated(subset=[USER_COL, TIME_COL]).sum() == 0, (
        "Duplicate (user_id, time) rows detected"
    )

    sorted_df = df.sort_values([USER_COL, TIME_COL])
    assert sorted_df.index.equals(df.index), (
        "Dataset not sorted by (user_id, date_freq)"
    )

    assert df.isna().sum().sum() == 0, (
        "Missing values detected in unified state"
    )

    numeric_cols = df.select_dtypes(include="number").columns
    assert (df[numeric_cols] >= -1e-6).all().all(), (
        "Invalid negative numeric values detected"
    )

    print("Unified state validation passed")


# Merge
# -------------------------------------------------
def run() -> None:
    print("Loading final datasets...")

    tracker = load_final("tracker_dataset")
    finance = load_final("finance_dataset")
    lendingclub = load_final("lendingclub")

    print("Injecting finance structural context...")
    finance_context = extract_finance_context(finance)
    for k, v in finance_context.items():
        tracker[k] = v

    print("Injecting LendingClub global priors...")
    lc_priors = extract_lendingclub_priors(lendingclub)
    for k, v in lc_priors.items():
        tracker[k] = v

    print("Aggregating duplicate tracker states...")
    tracker = aggregate_tracker_states(tracker)

    print("Sorting and validating unified state...")
    tracker = tracker.sort_values([USER_COL, TIME_COL]).reset_index(drop=True)
    validate_unified_state(tracker)

    outfile = PROC / "unified_financial_state.parquet"
    tracker.to_parquet(outfile, index=False)

    print(f"\n Unified financial state saved → {outfile}")


if __name__ == "__main__":
    run()
