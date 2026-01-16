from src.envs.debt_env import DebtEnv

env = DebtEnv("data/processed/unified_financial_state.parquet")
obs, _ = env.reset()

for _ in range(10):
    a = env.action_space.sample()
    obs, r, term, trunc, _ = env.step(a)
    print(r)
    if term or trunc:
        break
