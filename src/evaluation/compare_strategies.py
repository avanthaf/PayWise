from src.envs.debt_env import DebtEnv
from stable_baselines3 import DQN
from scipy import stats
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

N_EPISODES = 30
ALPHA = 0.05


def run_dqn(model: DQN, n_episodes: int) -> tuple:
    env = DebtEnv(str(DATA_PATH))
    rewards:     list = []
    steps:       list = []
    final_debts: list = []

    for _ in range(n_episodes):
        obs, _ = env.reset()
        done = False
        total_r = 0.0
        n_steps = 0

        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, r, terminated, truncated, _ = env.step(int(action))
            total_r += float(r)
            n_steps += 1
            done = terminated or truncated

        rewards.append(total_r)
        steps.append(n_steps)
        final_debts.append(float(env.outstanding_debt))

    env.close()
    return rewards, steps, final_debts


def run_rule_based(policy_fn, n_episodes: int) -> tuple:
    env = DebtEnv(str(DATA_PATH))
    rewards:     list = []
    steps:       list = []
    final_debts: list = []

    for _ in range(n_episodes):
        obs, _ = env.reset()
        done = False
        total_r = 0.0
        n_steps = 0

        while not done:
            row = env.current_episode.iloc[env.t]
            income = float(row["monthly_income"])
            expenses = float(row["monthly_expense_total"])
            min_payment = abs(float(row["loan_payment"]))
            disposable = max(income - expenses, 0.0)

            payment = float(policy_fn(disposable, min_payment))

            if payment <= min_payment:
                action = 0
            elif payment <= min_payment + 0.10 * disposable:
                action = 1
            elif payment <= min_payment + 0.25 * disposable:
                action = 2
            elif payment <= min_payment + 0.50 * disposable:
                action = 3
            else:
                action = 4

            obs, r, terminated, truncated, _ = env.step(action)
            total_r += float(r)
            n_steps += 1
            done = terminated or truncated

        rewards.append(total_r)
        steps.append(n_steps)
        final_debts.append(float(env.outstanding_debt))

    env.close()
    return rewards, steps, final_debts


def avalanche_policy(disposable: float, min_payment: float) -> float:
    return min_payment + disposable


def snowball_policy(disposable: float, min_payment: float) -> float:
    return min_payment + 0.8 * disposable


def cohen_d(a: np.ndarray, b: np.ndarray) -> float:
    std_a = float(np.std(a, ddof=1))
    std_b = float(np.std(b, ddof=1))
    pooled = ((std_a ** 2 + std_b ** 2) / 2) ** 0.5
    if pooled == 0.0:
        return 0.0
    return (float(np.mean(a)) - float(np.mean(b))) / pooled


def run_tests(a_rewards: list, b_rewards: list, label_a: str, label_b: str) -> dict:
    a = np.array(a_rewards, dtype=np.float64)
    b = np.array(b_rewards, dtype=np.float64)

    # Wilcoxon signed-rank (non-parametric, paired)
    w_stat_str = "N/A"
    w_pval_str = "N/A"
    w_pval_num = 1.0
    try:
        w_result = stats.wilcoxon(a, b, alternative="greater")
        w_stat_num = float(w_result.statistic)   # type: ignore[union-attr]
        w_pval_num = float(w_result.pvalue)       # type: ignore[union-attr]
        w_stat_str = f"{w_stat_num:.4f}"
        w_pval_str = f"{w_pval_num:.4f}"
    except Exception:
        pass

    # Independent t-test
    t_result = stats.ttest_ind(a, b, alternative="greater")
    t_stat_num = float(t_result.statistic)    # type: ignore[union-attr]
    t_pval_num = float(t_result.pvalue)       # type: ignore[union-attr]

    d = cohen_d(a, b)
    sig = "SIGNIFICANT ✓" if min(
        w_pval_num, t_pval_num) < ALPHA else "not significant"

    return {
        "comparison":    f"{label_a} vs {label_b}",
        "mean_a":        round(float(np.mean(a)), 4),
        "mean_b":        round(float(np.mean(b)), 4),
        "wilcoxon_stat": w_stat_str,
        "wilcoxon_pval": w_pval_str,
        "ttest_stat":    round(t_stat_num, 4),
        "ttest_pval":    round(t_pval_num, 4),
        "cohens_d":      round(d, 4),
        "result":        sig,
    }


def plot_comparison(results: dict) -> None:
    strategies = ["DQN", "Avalanche", "Snowball"]
    colors = {"DQN": "#2ecc71", "Avalanche": "#3498db", "Snowball": "#e74c3c"}
    metrics = ["rewards", "steps", "final_debts"]
    titles = ["Mean Total Reward",
              "Steps per Episode", "Final Outstanding Debt"]
    ylabels = ["Total Reward", "Steps", "Debt Balance"]

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    for ax, metric, title, ylabel in zip(axes, metrics, titles, ylabels):
        means = [float(np.mean(results[s][metric])) for s in strategies]
        stds = [float(np.std(results[s][metric])) for s in strategies]
        clrs = [colors[s] for s in strategies]

        bars = ax.bar(strategies, means, color=clrs, yerr=stds,
                      capsize=5, edgecolor="white",
                      error_kw={"elinewidth": 1.5})

        max_std = float(max(stds)) if stds else 0.0
        for bar, mean_val in zip(bars, means):
            ax.text(
                float(bar.get_x()) + float(bar.get_width()) / 2.0,
                float(bar.get_height()) + max_std * 0.05,
                f"{mean_val:.1f}",
                ha="center", va="bottom", fontsize=9, fontweight="bold",
            )

        ax.set_title(title, fontsize=11, fontweight="bold")
        ax.set_ylabel(ylabel, fontsize=10)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(True, axis="y", alpha=0.25)

    fig.suptitle(
        f"Strategy Comparison: DQN vs Rule-Based Methods\n"
        f"({N_EPISODES} episodes each, deterministic evaluation)",
        fontsize=13, fontweight="bold", y=1.02,
    )
    plt.tight_layout()
    out = REPORT_DIR / "strategy_comparison.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✓ Comparison chart saved → {out}")


def plot_reward_distributions(results: dict) -> None:
    strategies = ["DQN", "Avalanche", "Snowball"]
    colors = {"DQN": "#2ecc71", "Avalanche": "#3498db", "Snowball": "#e74c3c"}
    data = [results[s]["rewards"] for s in strategies]

    fig, ax = plt.subplots(figsize=(8, 5))

    # tick_labels used in matplotlib >= 3.9; fall back to labels for older versions
    try:
        bp = ax.boxplot(
            data,
            tick_labels=strategies,   # matplotlib >= 3.9
            patch_artist=True,
            medianprops={"color": "black", "linewidth": 2},
        )
    except TypeError:
        bp = ax.boxplot(
            data,
            labels=strategies,        # matplotlib < 3.9
            patch_artist=True,
            medianprops={"color": "black", "linewidth": 2},
        )

    for patch, s in zip(bp["boxes"], strategies):
        patch.set_facecolor(colors[s])
        patch.set_alpha(0.7)

    ax.set_ylabel("Total Episodic Reward", fontsize=11)
    ax.set_title(
        "Reward Distribution by Strategy\n"
        "(Box = IQR, Line = Median, Whiskers = Min/Max)",
        fontsize=12, fontweight="bold",
    )
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(True, axis="y", alpha=0.25)

    out = REPORT_DIR / "reward_distributions.png"
    plt.tight_layout()
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✓ Reward distributions saved → {out}")


def save_csv(results: dict) -> None:
    rows = []
    for strategy, data in results.items():
        rows.append({
            "strategy":        strategy,
            "mean_reward":     round(float(np.mean(data["rewards"])), 4),
            "std_reward":      round(float(np.std(data["rewards"])), 4),
            "mean_steps":      round(float(np.mean(data["steps"])), 2),
            "std_steps":       round(float(np.std(data["steps"])), 2),
            "mean_final_debt": round(float(np.mean(data["final_debts"])), 4),
            "std_final_debt":  round(float(np.std(data["final_debts"])), 4),
            "n_episodes":      N_EPISODES,
        })
    df = pd.DataFrame(rows)
    out = REPORT_DIR / "strategy_comparison.csv"
    df.to_csv(out, index=False)
    print(f"  ✓ Results CSV saved → {out}")


def save_stats(test_results: list) -> None:
    out = REPORT_DIR / "statistical_tests.txt"
    with open(out, "w") as f:
        f.write("STRATEGY COMPARISON — STATISTICAL VALIDATION\n")
        f.write("=" * 55 + "\n")
        f.write("H0: DQN reward <= baseline reward\n")
        f.write("H1: DQN reward >  baseline reward (one-sided)\n")
        f.write(f"Significance level alpha = {ALPHA}\n")
        f.write(f"N episodes per strategy: {N_EPISODES}\n\n")
        for r in test_results:
            f.write(f"Comparison : {r['comparison']}\n")
            f.write(f"  DQN mean      : {r['mean_a']}\n")
            f.write(f"  Baseline mean : {r['mean_b']}\n")
            f.write(
                f"  Wilcoxon      : stat={r['wilcoxon_stat']}  p={r['wilcoxon_pval']}\n")
            f.write(
                f"  t-test        : stat={r['ttest_stat']}  p={r['ttest_pval']}\n")
            f.write(f"  Cohen's d     : {r['cohens_d']}\n")
            f.write(f"  Result        : {r['result']}\n\n")
    print(f"  ✓ Statistical tests saved → {out}")


def print_summary(results: dict, test_results: list) -> None:
    print(f"\n{'='*60}")
    print(f"  STRATEGY COMPARISON SUMMARY  ({N_EPISODES} episodes each)")
    print(f"{'='*60}")
    print(f"  {'Strategy':<12} {'Mean Reward':>14} {'Std':>10} "
          f"{'Mean Steps':>12} {'Final Debt':>12}")
    print(f"  {'-'*60}")
    for s, d in results.items():
        print(
            f"  {s:<12} "
            f"{float(np.mean(d['rewards'])):>14.4f} "
            f"{float(np.std(d['rewards'])):>10.4f} "
            f"{float(np.mean(d['steps'])):>12.1f} "
            f"{float(np.mean(d['final_debts'])):>12.4f}"
        )
    print(f"\n  STATISTICAL RESULTS")
    print(f"  {'-'*60}")
    for r in test_results:
        print(f"  {r['comparison']:<30} → {r['result']}")
        print(f"  {'':>30}   Wilcoxon p={r['wilcoxon_pval']}  "
              f"t-test p={r['ttest_pval']}  d={r['cohens_d']}")
    print(f"{'='*60}\n")


def main() -> None:
    print(f"\n{'='*55}")
    print("  Strategy Comparison: DQN vs Avalanche vs Snowball")
    print(f"{'='*55}\n")

    model_zip = Path(str(MODEL_PATH) + ".zip")
    if not model_zip.exists():
        print(f"  ✗ Model not found: {model_zip}")
        print("    Run src/rl/train_dqn_3e-4.py first.")
        return

    print("  Loading DQN model...")
    model = DQN.load(str(MODEL_PATH))

    results: dict = {}

    print(f"\n  Running DQN ({N_EPISODES} episodes)...")
    r, s, d = run_dqn(model, N_EPISODES)
    results["DQN"] = {"rewards": r, "steps": s, "final_debts": d}
    print(f"  DQN mean reward: {float(np.mean(r)):.4f}")

    print(f"\n  Running Avalanche ({N_EPISODES} episodes)...")
    r, s, d = run_rule_based(avalanche_policy, N_EPISODES)
    results["Avalanche"] = {"rewards": r, "steps": s, "final_debts": d}
    print(f"  Avalanche mean reward: {float(np.mean(r)):.4f}")

    print(f"\n  Running Snowball ({N_EPISODES} episodes)...")
    r, s, d = run_rule_based(snowball_policy, N_EPISODES)
    results["Snowball"] = {"rewards": r, "steps": s, "final_debts": d}
    print(f"  Snowball mean reward: {float(np.mean(r)):.4f}")

    test_results = [
        run_tests(results["DQN"]["rewards"], results["Avalanche"]["rewards"],
                  "DQN", "Avalanche"),
        run_tests(results["DQN"]["rewards"], results["Snowball"]["rewards"],
                  "DQN", "Snowball"),
    ]

    print_summary(results, test_results)

    print("  Generating plots...")
    plot_comparison(results)
    plot_reward_distributions(results)

    print("  Saving results...")
    save_csv(results)
    save_stats(test_results)

    print(f"\n{'='*55}")
    print(f"  All outputs saved to: {REPORT_DIR}/")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
