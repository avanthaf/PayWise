import os
from pathlib import Path

import torch
from stable_baselines3 import DQN
from stable_baselines3.common.monitor import Monitor
from src.envs.debt_env import DebtEnv

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data/processed/unified_financial_state.parquet"
LOG_DIR = PROJECT_ROOT / "artifacts/rl_logs"
MODEL_DIR = PROJECT_ROOT / "artifacts/rl_models"

LOG_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def main():
    print("Loading DebtEnv...")
    env = DebtEnv(str(DATA_PATH))
    env = Monitor(env)

    print("Creating DQN model...")
    model = DQN(
        policy="MlpPolicy",
        env=env,
        learning_rate=3e-4,
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
        verbose=1,
        tensorboard_log="artifacts/rl_logs/adaptation_best_lr",
        device="auto",
    )

    print("Configuring logger...")

    print("Starting DQN training...")
    model.learn(
        total_timesteps=100_000,
        log_interval=10,
        progress_bar=True,
    )

    model_path = MODEL_DIR / "dqn_debt_env"
    model.save(str(model_path))

    print(f"\nTraining complete. Model saved to: {model_path}")


if __name__ == "__main__":
    main()
