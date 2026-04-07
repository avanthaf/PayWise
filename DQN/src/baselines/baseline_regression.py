# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

import sys
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

DATA_PATH = Path("data/processed/unified_financial_state.parquet")
REPORT_DIR = Path("reports/baselines")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

TARGET = "debt_to_income_ratio"
RANDOM_STATE = 50

FEATURES = [
    "monthly_income",
    "monthly_expense_total",
    "loan_payment",
]


# Load the dataset
def load_data():
    df = pd.read_parquet(DATA_PATH)
    x = df[FEATURES]
    y = df[TARGET]

    return x, y


def train_models(X_train, y_train):
    models = {
        # Predicts the mean of the training targets
        "MeanBaseline": DummyRegressor(strategy="mean"),

        # Predicts using a linear regression model
        "LinearRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LinearRegression())
        ]),

        # Predicts using a random forest regressor
        "RandomForest": RandomForestRegressor(
            n_estimators=100,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),
    }

    # Train each model
    trained = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        trained[name] = model

    return trained


# Evaluate models and print metrics
def evaluate_models(models, X_test, y_test):
    results = []

    for name, model in models.items():
        predictions = model.predict(X_test)

        # Calculate metrics
        mae = mean_absolute_error(y_test, predictions)
        rmse = root_mean_squared_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)

        results.append({
            "Model": name,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2,
        })

        print(
            f"{name:16s} | "
            f"MAE={mae:.4f} | "
            f"RMSE={rmse:.4f} | "
            f"R2={r2:.4f}"
        )

    return pd.DataFrame(results)


def main():
    X, y = load_data()

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,  # 80/20 split
        random_state=RANDOM_STATE
    )

    # Train baseline models
    models = train_models(X_train, y_train)

    # Evaluate models
    results = evaluate_models(models, X_test, y_test)

    outpath = REPORT_DIR / "baseline_regression_metrics.csv"
    results.to_csv(outpath, index=False)

    print(f"\nBaseline metrics saved → {outpath}")


if __name__ == "__main__":
    main()
