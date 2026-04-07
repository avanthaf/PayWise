# PayWise – ML Pipeline README

## Overview

This document covers the full machine learning pipeline for PayWise — from raw data ingestion through preprocessing, baseline modelling, DQN training, evaluation, and the Flask ML service that serves the frontend.

---

## Project Structure (ML)

```
src/
├── data_loading.py              # Dataset loaders
├── data_preprocessing.py        # Cleaning & normalization
├── data_outliers.py             # Outlier detection & capping
├── data_encoding.py             # Categorical encoding
├── data_model_ready.py          # Feature selection & scaling
├── data_merge_validate.py       # Dataset merging & schema validation
├── baselines/
│   ├── baseline_regression.py   # Regression baselines (Ridge, RF, XGBoost)
│   ├── record_baseline_metrics.py  # Persist metrics to JSON/CSV
│   └── visualize_baselines.py   # Bar charts of baseline performance
├── envs/
│   ├── debt_env.py              # Custom Gymnasium DebtEnv
│   ├── test_env.py              # Smoke-test the environment
│   └── test_debt_env.py         # Full unit tests for DebtEnv
├── rl/
│   ├── train_dqn.py             # Parameterized DQN training (canonical)
│   ├── test_repayment_engine.py # Unit tests for repayment logic
│   └── evaluate_dqn.py          # Post-training evaluation & plots
└── evaluation/
    ├── benchmark_strategies.py  # DQN vs Avalanche vs Snowball benchmark
    └── compare_strategies.py    # Statistical comparison (t-test, plots)
└── tests/
    ├── test_debt_env.py         # Full unit tests for DebtEnv (reset, step, reward, termination)
```

## Running the Full Pipeline

```
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Preprocessing pipeline
python -m src.data_preprocessing
python -m src.data_outliers
python -m src.data_encoding
python -m src.data_model_ready
python -m src.data_merge_validate

# 4. Baselines
python -m src.baselines.baseline_regression
python -m src.baselines.record_baseline_metrics
python -m src.baselines.visualize_baselines

# 5. Environment tests
python -m src.envs.test_env
python -m src.envs.test_debt_env

# 6. DQN training
python src/rl/train_dqn.py 

# 7. Repayment engine tests
python -m src.rl.test_repayment_engine

# 8. Evaluation
python src/rl/evaluate_dqn.py
python src/evaluation/benchmark_strategies.py
python src/evaluation/compare_strategies.py

```

## AI Usage Declaration

AI tools such as ChatGPT, Claude, Gemini, and Figma AI were used to assist with coding, debugging, UI design, and understanding concepts like Deep Q-Networks (DQN).
All outputs were reviewed, modified, and validated by the author.