import pandas as pd
from pathlib import Path

RAW = Path("data/raw")
PROC = Path("data/processed")
PROC.mkdir(parents=True, exist_ok=True)

def standardize_columns(df):
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
    outfile = PROC / "lendingclub_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile, low_memory=False)
    df = standardize_columns(df)

    if "int_rate" in df.columns:
        df["int_rate"] = df["int_rate"].astype(str).str.replace("%", "")
        df["int_rate"] = pd.to_numeric(df["int_rate"], errors="coerce")

    if "term" in df.columns:
        df["term"] = (
            df["term"].astype(str)
            .str.extract(r"(\d+)")
            .astype(float)
        )

    df = df.drop_duplicates()

    print(f"Saving cleaned {infile}")
    df.to_parquet(outfile, index=False)

    print("Processed", outfile)
    return df


# DATASET 2: finance_dataset_for_fintech_applications
# ------------------------
def preprocess_finance_dataset():
    infile = RAW / "finance_dataset_for_fintech_applications.csv"
    outfile = PROC / "finance_dataset_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    df = standardize_columns(df)

    if "loan_type" in df.columns:
        df["loan_type"] = df["loan_type"].fillna("none")

    df = df.drop_duplicates()

    print(f"Saving cleaned {infile}")
    df.to_parquet(outfile, index=False)

    print("Processed", outfile)
    return df


# DATASET 3: personal_finance_tracker_dataset
# ------------------------
def preprocess_tracker_dataset():
    infile = RAW / "personal_finance_tracker_dataset.csv"
    outfile = PROC / "tracker_dataset_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    df = standardize_columns(df)

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    df = df.sort_values(by=["user_id", "date"], na_position="last")

    df = df.drop_duplicates()

    print(f"Saving cleaned {infile}")
    df.to_parquet(outfile, index=False)

    print("Processed", outfile)
    return df


# DATASET 4: synthetic_personal_finance_dataset
# ------------------------
def preprocess_synthetic_dataset():
    infile = RAW / "synthetic_personal_finance_dataset.csv"
    outfile = PROC / "synthetic_finance_clean.parquet"

    print(f"Loading dataset - {infile}")
    df = pd.read_csv(infile)
    df = standardize_columns(df)

    df = df.fillna(df.median(numeric_only=True))
    df = df.fillna("unknown")  

    df = df.drop_duplicates()

    print(f"Saving cleaned {infile}")
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