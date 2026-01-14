import sys
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

DATA_PATH = Path("data/processed/unified_financial_state.parquet")
REPORT_DIR = Path("reports/baselines")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

TARGET = "debt_to_income_ratio"
RANDOM_STATE = 42


def load_data():
    df = pd.read_parquet(DATA_PATH)

    assert TARGET in df.columns, f"{TARGET} not found in dataset"

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    return X, y

# Train baseline models
# -------------------------------------------------


def train_models(X_train, y_train):
    models = {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(
            n_estimators=100,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),
    }

    trained = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        trained[name] = model

    return trained

# Evaluate models
# -------------------------------------------------


def evaluate_models(models, X_test, y_test):
    results = []

    for name, model in models.items():
        preds = model.predict(X_test)

        mae = mean_absolute_error(y_test, preds)
        mse = mean_squared_error(y_test, preds)
        rmse = mse ** 0.5

        r2 = r2_score(y_test, preds)

        results.append({
            "model": name,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        })

        print(f"{name} | MAE={mae:.4f}, RMSE={rmse:.4f}, R2={r2:.4f}")

    return pd.DataFrame(results)

# Main
# -------------------------------------------------


def main():
    print("Loading unified financial state...")
    X, y = load_data()

    print("Splitting train/test data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=RANDOM_STATE
    )

    print("Training baseline models...")
    models = train_models(X_train, y_train)

    print("Evaluating baseline models...")
    results = evaluate_models(models, X_test, y_test)

    outpath = REPORT_DIR / "baseline_regression_metrics.csv"
    results.to_csv(outpath, index=False)

    print(f"\n Baseline metrics saved → {outpath}")


if __name__ == "__main__":
    main()
