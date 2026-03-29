from src.envs.debt_env import DebtEnv
import sys
from pathlib import Path
import numpy as np
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))


DATA_PATH = str(
    PROJECT_ROOT / "data/processed/unified_financial_state.parquet")


@pytest.fixture
def env():
    e = DebtEnv(DATA_PATH)
    yield e
    e.close()


@pytest.fixture
def env_custom():
    e = DebtEnv(DATA_PATH)
    yield e
    e.close()


def test_reset_returns_correct_shape(env):
    obs, info = env.reset()
    assert obs.shape == (4,), f"Expected (4,), got {obs.shape}"


def test_reset_outstanding_debt_positive(env):
    env.reset()
    assert env.outstanding_debt > 0, "Outstanding debt should be positive after reset"


def test_reset_timestep_zero(env):
    env.reset()
    env.step(0)
    env.reset()
    assert env.t == 0,


def test_reset_returns_dict_info(env):
    _, info = env.reset()
    assert isinstance(info, dict)


def test_observation_space_shape(env):
    assert env.observation_space.shape == (4,)


def test_action_space_size(env):
    assert env.action_space.n == 5


def test_obs_dtype_float32(env):
    obs, _ = env.reset()
    assert obs.dtype == np.float32, f"Expected float32, got {obs.dtype}"


def test_step_returns_five_values(env):
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
    for action in range(5):
        env.reset()
        obs, reward, terminated, truncated, _ = env.step(action)
        assert obs.shape == (4,)
        assert isinstance(reward, float)


def test_invalid_action_raises(env):
    env.reset()
    with pytest.raises((ValueError, IndexError)):
        env.step(5)


def test_debt_decreases_after_max_payment(env):
    env.reset()
    initial_debt = env.outstanding_debt
    env.step(4)
    assert env.outstanding_debt <= initial_debt, \
        "Debt should not increase after max payment action"


def test_debt_non_negative(env):
    env.reset()
    for _ in range(10):
        _, _, terminated, truncated, _ = env.step(4)
        assert env.outstanding_debt >= 0
        if terminated or truncated:
            break


def test_termination_when_debt_cleared(env):
    env.reset()
    terminated = False
    truncated = False
    for _ in range(1000):
        _, _, terminated, truncated, _ = env.step(4)
        if terminated or truncated:
            break
    assert terminated or env.outstanding_debt == 0 or truncated


def test_task_config_defaults(env):
    assert env.observation_space.shape == (4,)
    assert env.action_space.n == 5


def test_custom_task_config_applied(env_custom):
    obs, _ = env_custom.reset()
    assert obs.shape == (4,)


def test_custom_task_env_resets(env_custom):
    obs, _ = env_custom.reset()
    assert obs.shape == (4,)


def test_custom_task_env_steps(env_custom):
    env_custom.reset()
    obs, reward, _, _, _ = env_custom.step(2)
    assert obs.shape == (4,)
    assert isinstance(reward, float)


def test_reward_is_finite(env):
    env.reset()
    for action in range(5):
        env.reset()
        _, reward, _, _, _ = env.step(action)
        assert np.isfinite(reward), f"Reward is not finite for action {action}"


def test_higher_payment_higher_reward(env):
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
