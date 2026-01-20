from pathlib import Path
from stable_baselines3 import DQN
from stable_baselines3.common.monitor import Monitor
from src.envs.debt_env import DebtEnv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data/processed/unified_financial_state.parquet"
MODEL_PATH = PROJECT_ROOT / "artifacts/rl_models/dqn_debt_env"

BASE_TASK = {
    "income_scale": 1.0,
    "expense_scale": 1.0,
    "interest_multiplier": 1.0,
    "stress_weight": 1.0,
}

NEW_TASK = {
    "income_scale": 0.7,
    "expense_scale": 1.3,
    "interest_multiplier": 1.5,
    "stress_weight": 1.2,
}


def train_from_scratch():
    print("\n=== Training from scratch on NEW TASK ===")

    env = DebtEnv(str(DATA_PATH), task_config=NEW_TASK)
    env = Monitor(env)

    model = DQN(
        "MlpPolicy",
        env,
        learning_rate=1e-3,
        buffer_size=50_000,
        learning_starts=1_000,
        batch_size=64,
        gamma=0.99,
        verbose=1,
        tensorboard_log="artifacts/rl_logs/adaptation_scratch",
    )

    model.learn(total_timesteps=20_000)
    env.close()


def fine_tune_pretrained():
    print("\n=== Fine-tuning PRETRAINED model on NEW TASK ===")

    env = DebtEnv(str(DATA_PATH), task_config=NEW_TASK)
    env = Monitor(env)

    model = DQN.load(
        str(MODEL_PATH),
        env=env,
        tensorboard_log="artifacts/rl_logs/adaptation_finetune",
    )

    model.learn(total_timesteps=20_000)
    env.close()


if __name__ == "__main__":
    train_from_scratch()
    fine_tune_pretrained()
