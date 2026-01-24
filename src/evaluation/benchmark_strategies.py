import numpy as np
import pandas as pd
from pathlib import Path

from src.envs.debt_env import DebtEnv
from stable_baselines3 import DQN

DATA_PATH = "data/processed/unified_financial_state.parquet"
RESULTS_DIR = Path("artifacts/benchmarks")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def snowball_policy(disposable_income, min_payment):
    return min_payment + 0.8 * disposable_income


def avalanche_policy(disposable_income, min_payment):
    return min_payment + disposable_income


def run_rule_based(env: DebtEnv, policy_fn):
    obs, _ = env.reset()
    done = False

    total_reward = 0.0
    steps = 0

    while not done:
        row = env.current_episode.iloc[env.t]

        income = float(row["monthly_income"])
        expenses = float(row["monthly_expense_total"])
        min_payment = float(row["loan_payment"])

        disposable_income = max(income - expenses, 0.0)
        payment = policy_fn(disposable_income, min_payment)

        if payment <= min_payment:
            action = 0
        elif payment <= min_payment + 0.1 * disposable_income:
            action = 1
        elif payment <= min_payment + 0.25 * disposable_income:
            action = 2
        elif payment <= min_payment + 0.5 * disposable_income:
            action = 3
        else:
            action = 4

        obs, reward, terminated, truncated, _ = env.step(action)
        total_reward += reward
        steps += 1

        done = terminated or truncated

    return steps, total_reward, env.outstanding_debt


def run_rl(env: DebtEnv, model: DQN):
    obs, _ = env.reset()
    done = False

    total_reward = 0.0
    steps = 0

    while not done:
        action, _ = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, _ = env.step(action)

        total_reward += reward
        steps += 1
        done = terminated or truncated

    return steps, total_reward, env.outstanding_debt


def main():
    env = DebtEnv(DATA_PATH)

    results = []

    steps, reward, debt = run_rule_based(env, snowball_policy)
    results.append({
        "strategy": "Snowball",
        "steps_to_debt_free": steps,
        "total_reward": reward,
        "final_debt": debt,
    })

    steps, reward, debt = run_rule_based(env, avalanche_policy)
    results.append({
        "strategy": "Avalanche",
        "steps_to_debt_free": steps,
        "total_reward": reward,
        "final_debt": debt,
    })

    rl_model = DQN.load("artifacts/rl_models/dqn_debt_env")
    steps, reward, debt = run_rl(env, rl_model)
    results.append({
        "strategy": "DQN_RL",
        "steps_to_debt_free": steps,
        "total_reward": reward,
        "final_debt": debt,
    })

    df = pd.DataFrame(results)
    outpath = RESULTS_DIR / "benchmark_results.csv"
    df.to_csv(outpath, index=False)

    print("\nBenchmark results:")
    print(df)
    print(f"\nSaved to {outpath}")


if __name__ == "__main__":
    main()
