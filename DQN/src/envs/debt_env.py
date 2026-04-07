# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

import numpy as np
import pandas as pd
import gymnasium as gym
from gymnasium import spaces


class DebtEnv(gym.Env):
    metadata = {"render_modes": ["human"]}

    EPISODE_LENGTH = 24

    ACTION_LABELS = [
        "Minimum payment only",
        "Minimum + 10% disposable income",
        "Minimum + 25% disposable income",
        "Minimum + 50% disposable income",
        "Minimum + 100% disposable income",
    ]

    def __init__(self, data_path: str):
        super().__init__()

        self.df = pd.read_parquet(data_path)
        self.df = self.df.sort_values(
            ["user_id", "date_freq"]).reset_index(drop=True)
        self.user_episodes = list(self.df.groupby("user_id"))

        self.STATE_COLS = [
            "monthly_income",
            "monthly_expense_total",
            "loan_payment",
            "debt_to_income_ratio",
        ]

        self.action_space = spaces.Discrete(5)
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf,
            shape=(len(self.STATE_COLS),),
            dtype=np.float32,
        )

        self.obs_dim = len(self.STATE_COLS)
        self.zero_state = np.zeros(self.obs_dim, dtype=np.float32)

        self.current_episode = pd.DataFrame()
        self.t = 0
        self.outstanding_debt = 0.0

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)

        attempts = 0
        while True:
            _, episode = self.user_episodes[np.random.randint(
                len(self.user_episodes))]
            first = episode.iloc[0]
            loan_payment = abs(float(first["loan_payment"]))
            dti = abs(float(first["debt_to_income_ratio"]))
            attempts += 1
            if dti > 0 and loan_payment > 0:
                break
            if attempts > 500:
                break

        if len(episode) < self.EPISODE_LENGTH:
            tiles = int(np.ceil(self.EPISODE_LENGTH / len(episode)))
            episode = pd.concat([episode] * tiles,
                                ignore_index=True).iloc[:self.EPISODE_LENGTH]

        self.current_episode = episode.reset_index(drop=True)
        self.t = 0
        self.outstanding_debt = abs(
            float(self.current_episode.iloc[0]["loan_payment"])) * float(self.EPISODE_LENGTH)

        return self._get_state(), {}

    def step(self, action: int):
        row = self.current_episode.iloc[self.t]

        income = float(row["monthly_income"])
        expenses = float(row["monthly_expense_total"])
        min_payment = abs(float(row["loan_payment"]))
        dti = float(row["debt_to_income_ratio"])

        disposable_income = max(income - expenses, 0.0)

        extra_fractions = [0.0, 0.10, 0.25, 0.50, 1.0]
        payment = min_payment + extra_fractions[action] * disposable_income
        payment = max(payment, min_payment)
        payment = min(payment, self.outstanding_debt)

        prev_debt = self.outstanding_debt
        self.outstanding_debt = max(self.outstanding_debt - payment, 0.0)

        reward = self._compute_reward(
            prev_debt, self.outstanding_debt, dti, payment, disposable_income
        )

        self.t += 1
        terminated = self.outstanding_debt <= 0.0
        truncated = self.t >= len(self.current_episode)

        if terminated:
            reward += 10.0

        next_state = self.zero_state.copy() if (
            terminated or truncated) else self._get_state()

        return next_state, reward, terminated, truncated, {}

    def _get_state(self) -> np.ndarray:
        if self.t >= len(self.current_episode):
            return self.zero_state.copy()
        row = self.current_episode.iloc[self.t]
        return np.array([
            float(row["monthly_income"]),
            float(row["monthly_expense_total"]),
            float(row["loan_payment"]),
            float(row["debt_to_income_ratio"]),
        ], dtype=np.float32)

    def _compute_reward(self, prev_debt, curr_debt, dti, payment, disposable_income) -> float:
        debt_reduction = prev_debt - curr_debt
        interest_cost = 0.02 * prev_debt
        stress_threshold = 0.9 * disposable_income
        stress_penalty = max(payment - stress_threshold,
                             0.0) if disposable_income > 0 else 0.0

        reward = (
            + 2.0 * debt_reduction
            - 0.5 * interest_cost
            - 0.5 * abs(dti)
            - 1.0 * stress_penalty
        )
        return float(reward)

    def render(self):
        print(f"Step {self.t} | Outstanding debt: {self.outstanding_debt:.4f}")
