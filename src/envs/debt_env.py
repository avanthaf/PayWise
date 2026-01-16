import numpy as np
import pandas as pd

import gymnasium as gym
from gymnasium import spaces


class DebtEnv(gym.Env):
    metadata = {"render_modes": ["human"]}

    def __init__(self, data_path: str):
        super().__init__()
        self.df: pd.DataFrame = pd.read_parquet(data_path)

        self.USER_COL = "user_id"
        self.TIME_COL = "date_freq"

        self.STATE_COLS = [
            "monthly_income",
            "monthly_expense_total",
            "debt_to_income_ratio",
            "loan_payment",
            "credit_score",
            "savings_rate",
        ]

        self.obs_dim: int = len(self.STATE_COLS)
        self.zero_state: np.ndarray = np.zeros(self.obs_dim, dtype=np.float32)

        required_cols = self.STATE_COLS + [self.USER_COL, self.TIME_COL]
        missing = [c for c in required_cols if c not in self.df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        self.df[self.STATE_COLS] = (
            self.df[self.STATE_COLS]
            .apply(pd.to_numeric, errors="coerce")
            .fillna(0.0)
        )

        self.df = self.df.sort_values(
            [self.USER_COL, self.TIME_COL]
        ).reset_index(drop=True)

        self.user_episodes = list(self.df.groupby(self.USER_COL))

        self.action_space = spaces.Discrete(5)

        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(len(self.STATE_COLS),),
            dtype=np.float32,
        )

        self.current_episode: pd.DataFrame = pd.DataFrame()
        self.t: int = 0
        self.outstanding_debt: float = 0.0

        # Normalization constants
        self.max_income = max(self.df["monthly_income"].max(), 1.0)
        self.max_expense = max(self.df["monthly_expense_total"].max(), 1.0)

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)

        _, episode = self.user_episodes[
            np.random.randint(len(self.user_episodes))
        ]

        self.current_episode = episode.reset_index(drop=True)
        self.t = 0

        first = self.current_episode.iloc[0]
        self.outstanding_debt = (
            float(first.at["debt_to_income_ratio"])
            * float(first.at["monthly_income"])
        )

        return self._get_state(), {}

    def step(self, action: int):
        # Current row (safe)
        row = self.current_episode.iloc[self.t]

        income = float(row.at["monthly_income"])
        expenses = float(row.at["monthly_expense_total"])
        min_payment = float(row.at["loan_payment"])
        dti = float(row.at["debt_to_income_ratio"])

        disposable_income = max(income - expenses, 0.0)

        if action == 0:
            payment = min_payment
        elif action == 1:
            payment = min_payment + 0.10 * disposable_income
        elif action == 2:
            payment = min_payment + 0.25 * disposable_income
        elif action == 3:
            payment = min_payment + 0.50 * disposable_income
        elif action == 4:
            payment = min_payment + disposable_income
        else:
            raise ValueError("Invalid action")

        payment = max(payment, min_payment)
        payment = min(payment, self.outstanding_debt)

        prev_debt = self.outstanding_debt
        self.outstanding_debt -= payment
        self.outstanding_debt = max(self.outstanding_debt, 0.0)

        reward = self._compute_reward(
            prev_debt=prev_debt,
            curr_debt=self.outstanding_debt,
            dti=dti,
            payment=payment,
            disposable_income=disposable_income,
            income=income,
        )

        self.t += 1

        terminated = self.outstanding_debt <= 0.0
        truncated = self.t >= len(self.current_episode)

        if terminated or truncated:
            next_state = self.zero_state.copy()
        else:
            next_state = self._get_state()

        return next_state, reward, terminated, truncated, {}

    def _get_state(self) -> np.ndarray:
        if self.t >= len(self.current_episode):
            return self.zero_state.copy()

        row = self.current_episode.iloc[self.t]

        state = np.array(
            [
                float(row.at["monthly_income"]) / self.max_income,
                float(row.at["monthly_expense_total"]) / self.max_expense,
                float(row.at["debt_to_income_ratio"]),
                float(row.at["loan_payment"]) / self.max_income,
                float(row.at["credit_score"]) / 850.0,
                float(row.at["savings_rate"]),
            ],
            dtype=np.float32,
        )

        return np.clip(state, 0.0, 1.0)

    def _compute_reward(
        self,
        prev_debt: float,
        curr_debt: float,
        dti: float,
        payment: float,
        disposable_income: float,
        income: float,
    ) -> float:

        alpha = 1.0   # debt burden
        beta = 0.5    # interest proxy
        gamma = 2.0   # stress penalty
        delta = 1.0   # debt reduction

        debt_reduction = prev_debt - curr_debt
        interest_cost = 0.02 * prev_debt

        stress_penalty = (
            (payment - disposable_income) / income
            if payment > disposable_income and income > 0
            else 0.0
        )

        reward = (
            -alpha * dti
            - beta * interest_cost
            - gamma * stress_penalty
            + delta * debt_reduction
        )

        return float(reward)

    def render(self):
        print(
            f"t={self.t}, outstanding_debt={self.outstanding_debt:.2f}"
        )
