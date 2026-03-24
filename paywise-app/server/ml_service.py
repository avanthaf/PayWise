import os
import sys
import math
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import joblib
from flask import Flask, request, jsonify
from stable_baselines3 import DQN

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "artifacts" / "rl_models" / "dqn_debt_final"
SCALER_PATH = BASE_DIR / "artifacts" / \
    "scalers" / "tracker_dataset_scaler.joblib"

MAX_MONTHS = 600

app = Flask(__name__)

print("Loading DQN model...")
try:
    model = DQN.load(str(MODEL_PATH))
    print(f"  DQN loaded from {MODEL_PATH}")
except Exception as e:
    print(f"  ERROR loading DQN model: {e}")
    model = None

print("Loading scaler...")
try:
    scaler = joblib.load(str(SCALER_PATH))
    print(f"  Scaler loaded from {SCALER_PATH}")
except Exception as e:
    print(f"  Scaler not found ({e}). Raw values will be used.")
    scaler = None


def month_label(offset: int) -> str:
    d = datetime.now().replace(day=1) + timedelta(days=32 * offset)
    return d.strftime("%b %Y")


def normalize(obs: np.ndarray) -> np.ndarray:
    if scaler is None:
        return obs
    try:
        arr = obs.reshape(1, -1)
        n_features = arr.shape[1]
        if hasattr(scaler, "mean_") and len(scaler.mean_) >= n_features:
            mean = scaler.mean_[:n_features]
            scale = scaler.scale_[:n_features]
            return ((arr - mean) / scale).flatten().astype(np.float32)
        else:
            return obs
    except Exception:
        return obs


def compute_payment(action: int, min_payment: float, disposable: float) -> float:
    if action == 0:
        return min_payment
    elif action == 1:
        return min_payment + 0.10 * disposable
    elif action == 2:
        return min_payment + 0.25 * disposable
    elif action == 3:
        return min_payment + 0.50 * disposable
    else:  # action == 4
        return min_payment + disposable


def action_label(action: int) -> str:
    labels = {
        0: "Minimum payment only",
        1: "Minimum + 10% extra",
        2: "Minimum + 25% extra",
        3: "Minimum + 50% extra",
        4: "Minimum + 100% extra (full disposable)",
    }
    return labels.get(action, "Unknown")


def simulate_dqn(
    income: float,
    total_expenses: float,
    total_balance: float,
    total_min_payment: float,
    avg_monthly_rate: float,
) -> dict:
    if model is None:
        return {"error": "DQN model is not loaded"}

    outstanding_debt = float(total_balance)
    disposable = max(income - total_expenses, 0.0)
    dti = total_min_payment / max(income, 1.0)

    total_interest_paid = 0.0
    total_paid = 0.0
    schedule = []
    action_counts = {i: 0 for i in range(5)}

    for month_idx in range(MAX_MONTHS):
        if outstanding_debt <= 0.01:
            break

        raw_obs = np.array(
            [income, total_expenses, total_min_payment, dti],
            dtype=np.float32,
        )
        obs = normalize(raw_obs)

        action, _ = model.predict(obs, deterministic=True)
        action = int(action)
        action_counts[action] += 1

        interest = outstanding_debt * avg_monthly_rate
        outstanding_debt += interest
        total_interest_paid += interest

        payment = compute_payment(action, total_min_payment, disposable)
        payment = max(payment, total_min_payment)
        payment = min(payment, 0.5 * outstanding_debt)
        payment = min(payment, outstanding_debt)

        principal_paid = payment - interest
        outstanding_debt -= payment
        outstanding_debt = max(outstanding_debt, 0.0)
        total_paid += payment

        effective_min = min(total_min_payment, outstanding_debt)
        dti = effective_min / max(income, 1.0)

        schedule.append({
            "month":         month_idx + 1,
            "label":         month_label(month_idx),
            "totalDebt":     round(max(outstanding_debt, 0)),
            "interestPaid":  round(interest),
            "principalPaid": round(max(principal_paid, 0)),
            "action":        action,
            "actionLabel":   action_label(action),
        })

    months_to_payoff = len(schedule)
    payoff_date = month_label(months_to_payoff)

    dominant_action = max(action_counts, key=action_counts.get)

    explanation = (
        f"The DQN agent was trained via Deep Q-Learning on thousands of simulated "
        f"debt repayment episodes. Given your income of LKR {round(income):,}, "
        f"expenses of LKR {round(total_expenses):,}, and total debt of "
        f"LKR {round(total_balance):,}, the agent most frequently chose "
        f"\"{action_label(dominant_action)}\" (action {dominant_action}). "
        f"This adaptive policy balances debt reduction speed against financial stress. "
        f"With this strategy you will be debt-free by {payoff_date} — "
        f"{months_to_payoff} months from now — having paid "
        f"LKR {round(total_interest_paid):,} in total interest."
    )

    return {
        "strategy":          "dqn_rl",
        # indicative
        "monthlyPayment":    round(total_min_payment + disposable * 0.5),
        "totalInterestPaid": round(total_interest_paid),
        "totalPaid":         round(total_paid),
        "monthsToPayoff":    months_to_payoff,
        "payoffDate":        payoff_date,
        "dominantAction":    dominant_action,
        "dominantActionLabel": action_label(dominant_action),
        "explanation":       explanation,
        "schedule":          schedule,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":      "ok",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json(force=True)

    required = ["income", "totalExpenses", "loans"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    income = float(data["income"])
    total_expenses = float(data["totalExpenses"])
    loans = data["loans"]

    if not loans:
        return jsonify({"error": "At least one loan is required"}), 400

    total_balance = sum(float(l["balance"]) for l in loans)
    total_min_payment = sum(float(l["minimumPayment"]) for l in loans)

    if total_balance > 0:
        avg_annual_rate = sum(
            float(l["interestRate"]) * float(l["balance"]) for l in loans
        ) / total_balance
    else:
        avg_annual_rate = sum(float(l["interestRate"])
                              for l in loans) / len(loans)

    avg_monthly_rate = avg_annual_rate / 100.0 / 12.0

    result = simulate_dqn(
        income=income,
        total_expenses=total_expenses,
        total_balance=total_balance,
        total_min_payment=total_min_payment,
        avg_monthly_rate=avg_monthly_rate,
    )

    if "error" in result:
        return jsonify(result), 500

    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8000))
    print(f"\nML Service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
