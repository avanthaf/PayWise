import argparse
from pathlib import Path

from stable_baselines3 import DQN
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import EvalCallback

from src.envs.debt_env import DebtEnv

DATA_PATH = Path("data/processed/unified_financial_state.parquet")
MODEL_DIR = Path("artifacts/rl_models")
LOG_DIR = Path("artifacts/rl_logs")
MODEL_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)


def parse_args():
    parser = argparse.ArgumentParser(description="Train DQN on DebtEnv")
    parser.add_argument("--lr",         type=float,
                        default=3e-4,    help="Learning rate")
    parser.add_argument("--timesteps",  type=int,
                        default=100_000, help="Total training timesteps")
    parser.add_argument("--seed",       type=int,
                        default=42,      help="Random seed")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 50)
    print("Personalized Debt Repayment — DQN Training")
    print("=" * 50)
    print(f"  Learning rate : {args.lr}")
    print(f"  Timesteps     : {args.timesteps:,}")
    print(f"  Seed          : {args.seed}")
    print()

    env = Monitor(DebtEnv(str(DATA_PATH)))
    eval_env = Monitor(DebtEnv(str(DATA_PATH)))

    model = DQN(
        policy="MlpPolicy",
        env=env,
        learning_rate=args.lr,
        buffer_size=50_000,
        learning_starts=1_000,
        batch_size=64,
        gamma=0.99,
        tau=1.0,
        target_update_interval=1_000,
        train_freq=4,
        gradient_steps=1,
        exploration_fraction=0.2,
        exploration_final_eps=0.05,
        seed=args.seed,
        verbose=1,
        tensorboard_log=str(LOG_DIR / "dqn"),
        device="auto",
    )

    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path=str(MODEL_DIR),
        log_path=str(LOG_DIR / "eval"),
        eval_freq=10_000,
        n_eval_episodes=10,
        deterministic=True,
        verbose=1,
    )

    print("Starting training...\n")
    model.learn(
        total_timesteps=args.timesteps,
        callback=eval_callback,
        log_interval=10,
        progress_bar=True,
    )

    final_path = MODEL_DIR / "dqn_debt_final"
    model.save(str(final_path))
    print(f"\nTraining complete.")
    print(f"  Final model  → {final_path}.zip")
    print(f"  Best model   → {MODEL_DIR}/best_model.zip")

    env.close()
    eval_env.close()


if __name__ == "__main__":
    main()
