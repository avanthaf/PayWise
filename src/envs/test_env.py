from src.envs.debt_env import DebtEnv


DATA_PATH = "data/processed/unified_financial_state.parquet"


def run_basic_env_test():
    print("\n=== Basic Environment Test ===")
    env = DebtEnv(DATA_PATH)

    obs, info = env.reset()
    print("Initial observation:", obs)

    for step in range(5):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)

        print(
            f"Step {step} | "
            f"Action={action} | "
            f"Reward={reward:.2f} | "
            f"Terminated={terminated} | "
            f"Truncated={truncated}"
        )

        if terminated or truncated:
            break

    env.close()


def run_task_parameterized_test():
    print("\n=== Task-Parameterized Environment Test ===")

    task_config = {
        "income_scale": 0.7,          # recession-like
        "expense_scale": 1.3,         # high expenses
        "interest_multiplier": 1.5,   # high interest
        "stress_weight": 1.2,
    }

    env = DebtEnv(
        DATA_PATH,
        task_config=task_config,
    )

    obs, info = env.reset()
    print("Initial observation (task):", obs)
    print("Task config:", task_config)

    for step in range(5):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)

        print(
            f"Step {step} | "
            f"Action={action} | "
            f"Reward={reward:.2f} | "
            f"Terminated={terminated} | "
            f"Truncated={truncated}"
        )

        if terminated or truncated:
            break

    env.close()


if __name__ == "__main__":
    run_basic_env_test()
    run_task_parameterized_test()
