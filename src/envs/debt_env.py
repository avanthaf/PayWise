import numpy as np
import pandas as pd

import gymnasium as gym
from gymnasium import spaces


# Debt Management Environment
class DebtEnv(gym.Env):
    metadata = {"render_modes": ["human"]}

    # Initialize the environment
    def __init__(self, data_path: str, task_config: dict | None = None):
        default_task = {
            "income_scale": 1.0,
            "expense_scale": 1.0,
            "interest_multiplier": 1.0,
            "stress_weight": 1.0,
        }

        self.task_config = {**default_task, **(task_config or {})}

        super().__init__()
        self.df: pd.DataFrame = pd.read_parquet(data_path)

        self.USER_COL = "user_id"
        self.TIME_COL = "date_freq"

        self.STATE_COLS = [
            "monthly_income",
            "monthly_expense_total",
            "loan_payment",
            "debt_to_income_ratio",
        ]

        # Sort data by user and time
        self.df = self.df.sort_values(
            [self.USER_COL, self.TIME_COL]
        ).reset_index(drop=True)

        # List of (user_id, user_data) tuples
        self.user_episodes = list(self.df.groupby(self.USER_COL))

        self.action_space = spaces.Discrete(5)  # 5 payment strategies

        # Observation space: continuous values for each state feature
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(len(self.STATE_COLS),),
            dtype=np.float32,
        )

        self.obs_dim = len(self.STATE_COLS)
        self.zero_state = np.zeros(self.obs_dim, dtype=np.float32)

        self.current_episode: pd.DataFrame = pd.DataFrame()
        self.t: int = 0
        self.outstanding_debt: float = 0.0

    # Reset the environment to start a new episode
    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)

        # Sample a user episode with non-zero debt-to-income ratio
        while True:
            _, episode = self.user_episodes[np.random.randint(
                len(self.user_episodes))]
            first = episode.iloc[0]
            if abs(float(first["debt_to_income_ratio"])) > 0:
                break

        self.current_episode = episode.reset_index(drop=True)
        self.t = 0

        first = self.current_episode.iloc[0]

        self.outstanding_debt = abs(float(first["debt_to_income_ratio"]))

        return self._get_state(), {}

    # Step the environment by one time step
    def step(self, action: int):
        row = self.current_episode.iloc[self.t]

        income = float(row["monthly_income"]) * \
            self.task_config["income_scale"]
        expenses = float(row["monthly_expense_total"]) * \
            self.task_config["expense_scale"]
        min_payment = abs(float(row["loan_payment"]))
        dti = float(row["debt_to_income_ratio"])

        disposable_income = max(income - expenses, 0.0)

        # Determine payment based on action
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
        # To avoid degenerate one-step payoffs
        payment = min(payment, 0.5 * self.outstanding_debt)
        payment = min(payment, self.outstanding_debt)

        prev_debt = self.outstanding_debt
        self.outstanding_debt -= payment
        self.outstanding_debt = max(self.outstanding_debt, 0.0)

        # Compute reward
        reward = self._compute_reward(
            prev_debt,
            self.outstanding_debt,
            dti,
            payment,
            disposable_income,
            income,
        )

        self.t += 1

        # Check termination conditions
        terminated = self.outstanding_debt <= 0.0
        truncated = self.t >= len(self.current_episode)

        next_state = (
            self.zero_state.copy()
            if (terminated or truncated)
            else self._get_state()
        )

        return next_state, reward, terminated, truncated, {}

    # Get the current state representation
    def _get_state(self) -> np.ndarray:
        if self.t >= len(self.current_episode):
            return self.zero_state.copy()

        row = self.current_episode.iloc[self.t]

        return np.array(
            [
                float(row["monthly_income"]),
                float(row["monthly_expense_total"]),
                float(row["loan_payment"]),
                float(row["debt_to_income_ratio"]),
            ],
            dtype=np.float32,
        )

    # Compute the reward based on current state and action
    def _compute_reward(
        self,
        prev_debt: float,
        curr_debt: float,
        dti: float,
        payment: float,
        disposable_income: float,
        income: float,
    ) -> float:

        alpha = 1.0
        beta = 0.5 * self.task_config["interest_multiplier"]
        gamma = 2.0 * self.task_config["stress_weight"]
        delta = 1.0

        debt_reduction = prev_debt - curr_debt
        interest_cost = 0.02 * prev_debt

        stress_penalty = (
            (payment - disposable_income)
            if payment > disposable_income
            else 0.0
        )

        reward = (
            -alpha * abs(dti)
            - beta * interest_cost
            - gamma * stress_penalty
            + delta * debt_reduction
        )

        return float(reward)

    # Render the current state of the environment
    def render(self):
        print(f"t={self.t}, outstanding_debt={self.outstanding_debt:.4f}")
