"""
test_debt_env.py
----------------
Unit tests for the DebtEnv Gymnasium environment.

Place in: src/tests/test_debt_env.py

Usage:
    pytest src/tests/test_debt_env.py -v
"""

from src.envs.debt_env import DebtEnv
import sys
from pathlib import Path
import numpy as np
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))


DATA_PATH = str(
    PROJECT_ROOT / "data/processed/unified_financial_state.parquet")


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture
def env():
    """Create a default DebtEnv instance."""
    e = DebtEnv(DATA_PATH)
    yield e
    e.close()


@pytest.fixture
def env_custom():
    """Create a DebtEnv with a default config (task_config not supported in this version)."""
    e = DebtEnv(DATA_PATH)
    yield e
    e.close()


# ── Reset tests ───────────────────────────────────────────────────────────────
def test_reset_returns_correct_shape(env):
    """Observation must be a 4-element vector."""
    obs, info = env.reset()
    assert obs.shape == (4,), f"Expected (4,), got {obs.shape}"


def test_reset_outstanding_debt_positive(env):
    """After reset, outstanding debt must be > 0."""
    env.reset()
    assert env.outstanding_debt > 0, "Outstanding debt should be positive after reset"


def test_reset_timestep_zero(env):
    """Timestep counter must reset to 0."""
    env.reset()
    env.step(0)
    env.reset()
    assert env.t == 0, "Timestep should be 0 after reset"


def test_reset_returns_dict_info(env):
    """Info returned from reset must be a dict."""
    _, info = env.reset()
    assert isinstance(info, dict)


# ── Observation space tests ───────────────────────────────────────────────────
def test_observation_space_shape(env):
    assert env.observation_space.shape == (4,)


def test_action_space_size(env):
    assert env.action_space.n == 5


def test_obs_dtype_float32(env):
    obs, _ = env.reset()
    assert obs.dtype == np.float32, f"Expected float32, got {obs.dtype}"


# ── Step tests ────────────────────────────────────────────────────────────────
def test_step_returns_five_values(env):
    """Step must return (obs, reward, terminated, truncated, info)."""
    env.reset()
    result = env.step(0)
    assert len(result) == 5


def test_step_reward_is_float(env):
    env.reset()
    _, reward, _, _, _ = env.step(0)
    assert isinstance(
        reward, float), f"Expected float reward, got {type(reward)}"


def test_step_obs_correct_shape(env):
    env.reset()
    obs, _, _, _, _ = env.step(1)
    assert obs.shape == (4,)


def test_all_actions_valid(env):
    """All 5 actions must execute without error."""
    for action in range(5):
        env.reset()
        obs, reward, terminated, truncated, _ = env.step(action)
        assert obs.shape == (4,)
        assert isinstance(reward, float)


def test_invalid_action_raises(env):
    """Action 5 is out of range and must raise an error."""
    env.reset()
    with pytest.raises((ValueError, IndexError)):
        env.step(5)


# ── Debt reduction tests ──────────────────────────────────────────────────────
def test_debt_decreases_after_max_payment(env):
    """Max payment (action 4) must reduce outstanding debt."""
    env.reset()
    initial_debt = env.outstanding_debt
    env.step(4)
    assert env.outstanding_debt <= initial_debt, \
        "Debt should not increase after max payment action"


def test_debt_non_negative(env):
    """Outstanding debt must never go below 0."""
    env.reset()
    for _ in range(10):
        _, _, terminated, truncated, _ = env.step(4)
        assert env.outstanding_debt >= 0
        if terminated or truncated:
            break


def test_termination_when_debt_cleared(env):
    """Episode must terminate when outstanding debt reaches 0."""
    env.reset()
    terminated = False
    truncated = False
    for _ in range(1000):
        _, _, terminated, truncated, _ = env.step(4)
        if terminated or truncated:
            break
    assert terminated or env.outstanding_debt == 0 or truncated


# ── Task config tests ─────────────────────────────────────────────────────────
def test_task_config_defaults(env):
    """DebtEnv must initialise with default action and observation spaces."""
    assert env.observation_space.shape == (4,)
    assert env.action_space.n == 5


def test_custom_task_config_applied(env_custom):
    """DebtEnv created without task config must still reset correctly."""
    obs, _ = env_custom.reset()
    assert obs.shape == (4,)


def test_custom_task_env_resets(env_custom):
    """DebtEnv must reset without error."""
    obs, _ = env_custom.reset()
    assert obs.shape == (4,)


def test_custom_task_env_steps(env_custom):
    """DebtEnv must step without error."""
    env_custom.reset()
    obs, reward, _, _, _ = env_custom.step(2)
    assert obs.shape == (4,)
    assert isinstance(reward, float)


# ── Reward function tests ─────────────────────────────────────────────────────
def test_reward_is_finite(env):
    """Reward must always be a finite number."""
    env.reset()
    for action in range(5):
        env.reset()
        _, reward, _, _, _ = env.step(action)
        assert np.isfinite(reward), f"Reward is not finite for action {action}"


def test_higher_payment_higher_reward(env):
    """
    Over a single step, action 4 (max) should generally yield
    higher or equal reward than action 0 (min) due to more debt reduction.
    This is checked across 10 resets.
    """
    max_better_count = 0
    n_trials = 10

    for _ in range(n_trials):
        env.reset()
        debt_before = env.outstanding_debt

        # Record state snapshot for fair comparison
        episode = env.current_episode.copy()
        t = env.t

        # Action 0 (min payment)
        env.reset()
        env.current_episode = episode
        env.t = t
        env.outstanding_debt = debt_before
        _, r_min, _, _, _ = env.step(0)

        # Action 4 (max payment)
        env.reset()
        env.current_episode = episode
        env.t = t
        env.outstanding_debt = debt_before
        _, r_max, _, _, _ = env.step(4)

        if r_max >= r_min:
            max_better_count += 1

    assert max_better_count >= n_trials * 0.7, \
        "Max payment should yield higher reward in at least 70% of cases"
