# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

from src.envs.debt_env import DebtEnv
from stable_baselines3 import DQN
import matplotlib.ticker as mticker
import matplotlib.pyplot as plt
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

DATA_PATH = PROJECT_ROOT / "data/processed/unified_financial_state.parquet"
MODEL_PATH = PROJECT_ROOT / "artifacts/rl_models/dqn_debt_env"
REPORT_DIR = PROJECT_ROOT / "reports/evaluation"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

N_EVAL_EPISODES = 50


def evaluate_model(model, n_episodes: int = N_EVAL_EPISODES):
    env = DebtEnv(str(DATA_PATH))
    episode_rewards = []

    for ep in range(n_episodes):
        obs, _ = env.reset()
        done = False
        total_reward = 0.0

        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, _ = env.step(int(action))
            total_reward += reward
            done = terminated or truncated

        episode_rewards.append(total_reward)
        if (ep + 1) % 10 == 0:
            print(f"  Episode {ep+1}/{n_episodes} | "
                  f"Reward: {total_reward:.2f} | "
                  f"Running mean: {np.mean(episode_rewards):.2f}")

    env.close()
    return episode_rewards


def plot_reward_curve(rewards: list):
    episodes = list(range(1, len(rewards) + 1))

    # Rolling mean (window=5)
    window = min(5, len(rewards))
    rolling = pd.Series(rewards).rolling(
        window=window, min_periods=1).mean().tolist()

    fig, ax = plt.subplots(figsize=(10, 5))

    ax.plot(episodes, rewards, color="#aaa", linewidth=1,
            alpha=0.6, label="Episode reward")
    ax.plot(episodes, rolling, color="#000", linewidth=2.5,
            label=f"Rolling mean (window={window})")

    ax.axhline(float(np.mean(rewards)), color="#e74c3c", linestyle="--",
               linewidth=1.5, label=f"Mean = {np.mean(rewards):.2f}")

    ax.fill_between(episodes, rewards, alpha=0.08, color="#000")

    ax.set_xlabel("Episode", fontsize=11)
    ax.set_ylabel("Total Episodic Reward", fontsize=11)
    ax.set_title("DQN Agent — Evaluation Reward Curve\n"
                 f"({N_EVAL_EPISODES} episodes, deterministic policy)",
                 fontsize=12, fontweight="bold")
    ax.legend(fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(True, alpha=0.25)

    out = REPORT_DIR / "dqn_reward_curve.png"
    plt.tight_layout()
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"\n  ✓ Reward curve saved → {out}")


def plot_policy_heatmap(model):
    dti_range = np.linspace(0.1, 2.5, 25)   # debt-to-income ratio
    income_range = np.linspace(20000, 200000, 25)  # monthly income (LKR)

    action_grid = np.zeros((len(dti_range), len(income_range)), dtype=int)

    for i, dti in enumerate(dti_range):
        for j, income in enumerate(income_range):
            # Build a representative state vector
            obs = np.array(
                [income,           # monthly_income
                 0.5 * income,     # monthly_expense_total
                 0.1 * income,     # loan_payment
                 dti],             # debt_to_income_ratio
                dtype=np.float32,
            )
            action, _ = model.predict(obs, deterministic=True)
            action_grid[i, j] = int(action)

    action_labels = [
        "0 — Min Payment",
        "1 — +10% Surplus",
        "2 — +25% Surplus",
        "3 — +50% Surplus",
        "4 — Max Payment",
    ]

    fig, ax = plt.subplots(figsize=(11, 6))
    cmap = plt.cm.get_cmap("RdYlGn", 5)
    im = ax.imshow(
        action_grid,
        aspect="auto",
        origin="lower",
        cmap=cmap,
        vmin=0, vmax=4,
        extent=(float(income_range[0]), float(income_range[-1]),
                float(dti_range[0]),    float(dti_range[-1])),
    )

    ax.set_xlabel("Monthly Income (LKR)", fontsize=11)
    ax.set_ylabel("Debt-to-Income Ratio", fontsize=11)
    ax.set_title(
        "DQN Policy Heatmap — Recommended Payment Action\n"
        "by Financial Profile (Income × Debt-to-Income Ratio)",
        fontsize=12, fontweight="bold",
    )

    cbar = plt.colorbar(im, ax=ax, ticks=[0.4, 1.2, 2.0, 2.8, 3.6])
    cbar.ax.set_yticklabels(action_labels, fontsize=9)
    cbar.set_label("Recommended Action", fontsize=10)

    ax.xaxis.set_major_formatter(
        mticker.FuncFormatter(lambda x, _: f"LKR {int(x):,}")
    )

    out = REPORT_DIR / "dqn_policy_heatmap.png"
    plt.tight_layout()
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✓ Policy heatmap saved → {out}")


def save_summary(rewards: list):
    summary = {
        "n_episodes":   [N_EVAL_EPISODES],
        "mean_reward":  [round(float(np.mean(rewards)), 4)],
        "std_reward":   [round(float(np.std(rewards)), 4)],
        "min_reward":   [round(float(np.min(rewards)), 4)],
        "max_reward":   [round(float(np.max(rewards)), 4)],
        "median_reward": [round(float(np.median(rewards)), 4)],
    }
    df = pd.DataFrame(summary)
    out = REPORT_DIR / "dqn_eval_summary.csv"
    df.to_csv(out, index=False)

    print(f"\n  DQN Evaluation Summary")
    print(f"  {'─'*35}")
    print(f"  Episodes : {N_EVAL_EPISODES}")
    print(f"  Mean     : {summary['mean_reward'][0]:.4f}")
    print(f"  Std      : {summary['std_reward'][0]:.4f}")
    print(f"  Min      : {summary['min_reward'][0]:.4f}")
    print(f"  Max      : {summary['max_reward'][0]:.4f}")
    print(f"  Median   : {summary['median_reward'][0]:.4f}")
    print(f"  {'─'*35}")
    print(f"  ✓ Summary saved → {out}")


def main():
    print(f"\n{'='*55}")
    print("  DQN Evaluation")
    print(f"{'='*55}\n")

    if not Path(str(MODEL_PATH) + ".zip").exists():
        print(f"  ✗ Model not found at {MODEL_PATH}.zip")
        print("    Run src/rl/train_dqn_3e-4.py first.")
        return

    print(f"  Loading model from {MODEL_PATH} ...")
    model = DQN.load(str(MODEL_PATH))

    print(f"\n  Evaluating over {N_EVAL_EPISODES} episodes...")
    rewards = evaluate_model(model)

    print("\n  Generating reward curve...")
    plot_reward_curve(rewards)

    print("  Generating policy heatmap...")
    plot_policy_heatmap(model)

    save_summary(rewards)

    print(f"\n{'='*55}")
    print(f"  All outputs saved to: {REPORT_DIR}/")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
