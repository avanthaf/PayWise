from src.envs.debt_env import DebtEnv

DATA_PATH = "data/processed/unified_financial_state.parquet"


# Test to run the DebtEnv environment
def run_env_test():
    env = DebtEnv(DATA_PATH)

    observation, info = env.reset()
    print("Initial observation:", observation)

    for step in range(5):
        action = env.action_space.sample()
        observation, reward, terminated, truncated, info = env.step(action)

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


# Test to run the DebtEnv environment with parameterized task configuration
def run_task_parameterized_test():
    task_config = {
        "income_scale": 0.7,
        "expense_scale": 1.3,
        "interest_multiplier": 1.5,
        "stress_weight": 1.2,
    }

    env = DebtEnv(
        DATA_PATH,
        task_config=task_config,
    )

    observation, info = env.reset()
    print("Initial observation (task):", observation)
    print("Task config:", task_config)

    for step in range(5):
        action = env.action_space.sample()
        observation, reward, terminated, truncated, info = env.step(action)

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
    run_env_test()
    run_task_parameterized_test()
