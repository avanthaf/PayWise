# AI Usage Note:
# Some parts of this implementation were assisted by AI tools such as ChatGPT and Claude code.
# All code was reviewed and validated by the author.

import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))


def calculate_repayment(loans: list, monthly_budget: float, strategy: str) -> dict:

    MAX_MONTHS = 600

    remaining = [
        {
            "label":          l["label"],
            "balance":        float(l["balance"]),
            "monthly_rate":   l["interestRate"] / 100 / 12,
            "min_payment":    float(l["minimumPayment"]),
        }
        for l in loans
    ]

    total_minimums = sum(r["min_payment"] for r in remaining)
    extra_budget = max(monthly_budget - total_minimums, 0)

    schedule = []
    total_interest = 0.0
    total_paid = 0.0

    for month in range(1, MAX_MONTHS + 1):
        remaining = [r for r in remaining if r["balance"] > 0.01]
        if not remaining:
            break

        month_interest = 0.0
        for loan in remaining:
            interest = loan["balance"] * loan["monthly_rate"]
            loan["balance"] += interest
            month_interest += interest
        total_interest += month_interest

        month_principal = 0.0
        for loan in remaining:
            payment = min(loan["min_payment"], loan["balance"])
            loan["balance"] -= payment
            month_principal += payment
        total_paid += month_principal + month_interest

        extra = extra_budget
        sorted_loans = [r for r in remaining if r["balance"] > 0.01]

        if strategy == "avalanche":
            sorted_loans.sort(key=lambda x: -x["monthly_rate"])
        else:
            sorted_loans.sort(key=lambda x: x["balance"])

        for target in sorted_loans:
            if extra <= 0:
                break
            loan = next(
                (r for r in remaining if r["label"] == target["label"]), None)
            if loan is None or loan["balance"] <= 0.01:
                continue
            payment = min(extra, loan["balance"])
            loan["balance"] -= payment
            extra -= payment
            total_paid += payment

        total_debt = sum(max(r["balance"], 0) for r in remaining)
        schedule.append({
            "month":          month,
            "total_debt":     round(total_debt),
            "interest_paid":  round(month_interest),
            "principal_paid": round(month_principal),
        })

    return {
        "strategy":           strategy,
        "months_to_payoff":   len(schedule),
        "total_interest":     round(total_interest),
        "total_paid":         round(total_paid),
        "monthly_budget":     monthly_budget,
    }


SINGLE_LOAN = [
    {"label": "Car Loan", "balance": 500000,
     "interestRate": 12.0, "minimumPayment": 10000},
]

TWO_LOANS = [
    {"label": "Car Loan",    "balance": 500000,
     "interestRate": 12.0, "minimumPayment": 10000},
    {"label": "Credit Card", "balance": 150000,
     "interestRate": 24.0, "minimumPayment": 5000},
]

MONTHLY_BUDGET = 25000


def test_avalanche_pays_off_debt():
    result = calculate_repayment(SINGLE_LOAN, MONTHLY_BUDGET, "avalanche")
    assert result["months_to_payoff"] > 0
    assert result["total_interest"] > 0
    assert result["strategy"] == "avalanche"


def test_snowball_pays_off_debt():
    result = calculate_repayment(SINGLE_LOAN, MONTHLY_BUDGET, "snowball")
    assert result["months_to_payoff"] > 0
    assert result["strategy"] == "snowball"


def test_avalanche_finishes_within_600_months():
    result = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "avalanche")
    assert result["months_to_payoff"] < 600, "Should pay off before hitting max months"


def test_snowball_finishes_within_600_months():
    result = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "snowball")
    assert result["months_to_payoff"] < 600


def test_total_paid_greater_than_total_debt():
    original_debt = sum(l["balance"] for l in TWO_LOANS)
    result = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "avalanche")
    assert result["total_paid"] >= original_debt, \
        "Total paid should be >= original debt (interest is always added)"


def test_higher_budget_pays_off_faster():
    result_low = calculate_repayment(TWO_LOANS, 20000, "avalanche")
    result_high = calculate_repayment(TWO_LOANS, 40000, "avalanche")
    assert result_high["months_to_payoff"] < result_low["months_to_payoff"], \
        "Higher budget should pay off debt faster"


def test_higher_budget_reduces_interest():
    result_low = calculate_repayment(TWO_LOANS, 20000, "avalanche")
    result_high = calculate_repayment(TWO_LOANS, 40000, "avalanche")
    assert result_high["total_interest"] < result_low["total_interest"], \
        "Higher budget should reduce total interest"


def test_avalanche_less_interest_than_snowball():
    avalanche = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "avalanche")
    snowball = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "snowball")
    assert avalanche["total_interest"] <= snowball["total_interest"], \
        "Avalanche should pay less total interest than Snowball"


def test_both_strategies_same_budget():
    avalanche = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "avalanche")
    snowball = calculate_repayment(TWO_LOANS, MONTHLY_BUDGET, "snowball")
    assert avalanche["monthly_budget"] == snowball["monthly_budget"]


def test_budget_exactly_minimum():
    min_budget = sum(l["minimumPayment"] for l in TWO_LOANS)
    result = calculate_repayment(TWO_LOANS, min_budget, "avalanche")
    assert result["months_to_payoff"] > 0


def test_single_loan_avalanche_snowball_same():
    avalanche = calculate_repayment(SINGLE_LOAN, MONTHLY_BUDGET, "avalanche")
    snowball = calculate_repayment(SINGLE_LOAN, MONTHLY_BUDGET, "snowball")
    assert avalanche["months_to_payoff"] == snowball["months_to_payoff"]
    assert avalanche["total_interest"] == snowball["total_interest"]


def test_zero_interest_loan():
    zero_interest_loan = [
        {"label": "Family Loan", "balance": 100000,
         "interestRate": 0.0, "minimumPayment": 5000},
    ]
    result = calculate_repayment(zero_interest_loan, 10000, "avalanche")
    assert result["total_interest"] == 0
