PayWise – IPD Prototype

This folder contains the working prototype for the Interim Progression Demonstration (IPD).

Included components:
- Data preprocessing and integration pipeline
- Baseline regression models for benchmarking
- Custom debt management environment
- Conceptual frontend wireframes

How to run:
1. Create the Virtual ENV
	python -m venv venv
	venv\Scripts\activate
	activate venv
2. Install dependencies from requirements.txt 
	pip install -r requirements.txt
3. Run preprocessing scripts
	python -m src.data_preprocessing
	python -m src.data_outliers
	python -m src.data_encoding
	python -m src.data_model_ready
	python -m src.data_merge_validate
4. Run baseline_regression.py
	python -m src.baselines.baseline_regression.py
	python -m src.baselines.record_baseline_metrics.py
	python -m src.baselines.visualize_baselines.py
5. Run test_env.py to test the decision environment
	python -m src.envs.test_env
6. Work In Progress
	python src/rl/train_dqn_1e-4.py
	python src/rl/train_dqn_3e-4.py
	python src/rl/train_dqn_1e-3.py
	python src/rl/test_adaptation.py
	python src/rl/test_adaptation_best_lr.py
	python src/evaluation/benchmark_strategies.py

Note:
This prototype focuses on the backend analytical core.
User interface implementation is planned for later phases.





