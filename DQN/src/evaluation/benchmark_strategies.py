import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from stable_baselines3 import DQN
from src.envs.debt_env import DebtEnv

DATA_PATH = Path("data/processed/unified_financial_state.parquet")
MODEL_PATH = Path("artifacts/rl_models/best_model")
RESULTS_DIR = Path("artifacts/benchmarks")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def snowball_action(disposable_income: float, min_payment: float) -> int:
    target = min_payment + 0.8 * disposable_income
    if target <= min_payment:
        return 0
    if target <= min_payment + 0.1 * disposable_income:
        return 1
    if target <= min_payment + 0.25 * disposable_income:
        return 2
    if target <= min_payment + 0.5 * disposable_income:
        return 3
    return 4


def avalanche_action(disposable_income: float, min_payment: float) -> int:
    return 4


def run_rule_based(env: DebtEnv, policy_fn) -> dict:
    obs, _ = env.reset()
    total_reward, steps, done = 0.0, 0, False

    while not done:
        row = env.current_episode.iloc[env.t]
        income = float(row["monthly_income"])
        expenses = float(row["monthly_expense_total"])
        min_payment = abs(float(row["loan_payment"]))
        disposable = max(income - expenses, 0.0)

        action = policy_fn(disposable, min_payment)
        obs, reward, terminated, truncated, _ = env.step(action)
        total_reward += reward
        steps += 1
        done = terminated or truncated

    return {"reward": total_reward, "steps": steps, "final_debt": env.outstanding_debt}


def run_dqn(env: DebtEnv, model: DQN) -> dict:
    obs, _ = env.reset()
    total_reward, steps, done = 0.0, 0, False

    while not done:
        action, _ = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, _ = env.step(int(action))
        total_reward += reward
        steps += 1
        done = terminated or truncated

    return {"reward": total_reward, "steps": steps, "final_debt": env.outstanding_debt}


def run_benchmark(n_episodes: int) -> pd.DataFrame:
    env = DebtEnv(str(DATA_PATH))
    model = DQN.load(str(MODEL_PATH), env=env)

    strategies = {
        "Snowball": lambda: run_rule_based(env, snowball_action),
        "Avalanche": lambda: run_rule_based(env, avalanche_action),
        "DQN Agent": lambda: run_dqn(env, model),
    }

    records = []
    for name, run_fn in strategies.items():
        print(f"Running {name} for {n_episodes} episodes...")
        for ep in range(n_episodes):
            result = run_fn()
            records.append({"strategy": name, "episode": ep, **result})

    env.close()
    return pd.DataFrame(records)


def plot_results(df: pd.DataFrame):
    summary = (
        df.groupby("strategy")[["reward", "steps", "final_debt"]]
        .mean()
        .reset_index()
    )

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle("Strategy Comparison: DQN vs Traditional Methods",
                 fontsize=14, fontweight="bold")

    colors = {"Snowball": "#f4a261",
              "Avalanche": "#e76f51", "DQN Agent": "#2a9d8f"}

    metrics = [
        ("reward",     "Average Total Reward",    "Higher is better ↑"),
        ("steps",      "Average Steps to Done",   "Lower is better ↓"),
        ("final_debt", "Average Remaining Debt",  "Lower is better ↓"),
    ]

    for ax, (col, title, subtitle) in zip(axes, metrics):
        bars = ax.bar(
            summary["strategy"],
            summary[col],
            color=[colors[s] for s in summary["strategy"]],
            edgecolor="white",
            linewidth=1.2,
        )
        ax.set_title(f"{title}\n({subtitle})", fontsize=11)
        ax.set_ylabel(col.replace("_", " ").title())
        ax.bar_label(bars, fmt="%.2f", padding=3, fontsize=9)
        ax.spines[["top", "right"]].set_visible(False)

    plt.tight_layout()
    out = RESULTS_DIR / "benchmark_comparison.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    print(f"\nPlot saved → {out}")
    plt.show()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--episodes", type=int, default=100,
                        help="Episodes per strategy")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 50)
    print("Strategy Benchmark")
    print("=" * 50)

    df = run_benchmark(args.episodes)

    csv_path = RESULTS_DIR / "benchmark_results.csv"
    df.to_csv(csv_path, index=False)
    print(f"Raw results saved → {csv_path}")

    print("\n── Summary (mean across episodes) ──")
    summary = df.groupby("strategy")[["reward", "steps", "final_debt"]].mean()
    print(summary.to_string())

    plot_results(df)


if __name__ == "__main__":
    main()
