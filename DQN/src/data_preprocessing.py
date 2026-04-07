# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

import pandas as pd
from pathlib import Path

RAW = Path("data/raw")
PROCESSED = Path("data/processed")
PROCESSED.mkdir(parents=True, exist_ok=True)


def standardize_columns(df):  # Standardizing all the column names
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace(".", "_")
    )
    return df


# DATASET 1: Lending Club
# ------------------------
def preprocess_lending_club():
    infile = RAW / "lending_club_loan_data.csv"
    outfile = PROCESSED / "lendingclub_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile, low_memory=False)
    df = standardize_columns(df)

    # Required columns
    df = df[[
        "loan_amnt",
        "int_rate",
        "installment",
    ]]

    df = df.drop_duplicates()  # Removing duplicate entries

    df.to_parquet(outfile, index=False)
    print("Processed", outfile)
    return df


# DATASET 2: finance_dataset_for_fintech_applications
# ------------------------
def preprocess_finance_dataset():
    infile = RAW / "finance_dataset_for_fintech_applications.csv"
    outfile = PROCESSED / "finance_dataset_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    df = standardize_columns(df)

    # Required columns
    df = df[[
        "customer_profile_customer_id",
        "account_activity_deposits",
        "account_activity_withdrawals"
    ]]

    df = df.drop_duplicates()  # Removing duplicate entries

    df.to_parquet(outfile, index=False)
    print("Processed", outfile)
    return df


# DATASET 3: personal_finance_tracker_dataset
# ------------------------
def preprocess_tracker_dataset():
    infile = RAW / "personal_finance_tracker_dataset.csv"
    outfile = PROCESSED / "tracker_dataset_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    # Standardizing the column names of the dataset
    df = standardize_columns(df)

    # Required columns
    df = df[[
        "user_id",
        "date",
        "monthly_income",
        "monthly_expense_total",
        "loan_payment",
    ]]

    # Converting the dates and time column
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    df = df.drop_duplicates()  # Removing duplicate entries

    df.to_parquet(outfile, index=False)
    print("Processed", outfile)
    return df


# DATASET 4: synthetic_personal_finance_dataset
# ------------------------
def preprocess_synthetic_dataset():
    infile = RAW / "synthetic_personal_finance_dataset.csv"
    outfile = PROCESSED / "synthetic_finance_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    # Standardizing the column names of the dataset
    df = standardize_columns(df)

    # Required columns
    df = df[[
        "user_id",
        "record_date",
        "monthly_income_usd",
        "monthly_expenses_usd",
        "monthly_emi_usd",
    ]]

    # Converting the dates and time from string
    df["record_date"] = pd.to_datetime(df["record_date"], errors="coerce")

    df = df.drop_duplicates()  # Removing duplicate entries

    df.to_parquet(outfile, index=False)
    print("Processed synthetic dataset →", outfile)
    return df


def run_all():
    preprocess_lending_club()
    preprocess_finance_dataset()
    preprocess_tracker_dataset()
    preprocess_synthetic_dataset()
    print("\nAll datasets processed successfully!")


if __name__ == "__main__":
    run_all()
