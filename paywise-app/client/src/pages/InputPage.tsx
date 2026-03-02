import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import { useNavigate } from "react-router-dom";

interface Expense {
  label: string;
  amount: number;
}

interface Loan {
  label: string;
  amount: number;
}

export default function InputPage() {
  const [income, setIncome] = useState<number | "">("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanLabel, setLoanLabel] = useState("");
  const [loanAmount, setLoanAmount] = useState<number | "">("");

  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  useEffect(() => {
  if (!localStorage.getItem("userName")) {
    navigate("/login");
  }
}, [navigate]);

  const addExpense = () => {
    if (!expenseLabel || !expenseAmount) return;

    setExpenses([
      ...expenses,
      { label: expenseLabel, amount: Number(expenseAmount) },
    ]);

    setExpenseLabel("");
    setExpenseAmount("");
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const addLoan = () => {
    if (!loanLabel || !loanAmount) return;

    setLoans([
      ...loans,
      { label: loanLabel, amount: Number(loanAmount) },
    ]);

    setLoanLabel("");
    setLoanAmount("");
  };

  const removeLoan = (index: number) => {
    setLoans(loans.filter((_, i) => i !== index));
  };

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalLoans = loans.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const balance =
    income !== ""
      ? Number(income) - totalExpenses - totalLoans
      : 0;
  
  const handleLogout = () => {
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <PageLayout>
      <div className="page-content">
        <div className="card welcome-banner" style={{ marginBottom: "16px" }}>
        <span>Welcome back, <strong>{userName || "User"}</strong></span>
        <button onClick={handleLogout} style={{ width: "fit-content", padding: "6px 16px" }}>
          LOGOUT
        </button>
      </div>
        <div className="app-title">
          FINANCIAL DATA
        </div>

        <div className="card">
          <div className="card-title">MONTHLY INCOME</div>

          <label>Amount (LKR)</label>
          <input
            type="number"
            value={income}
            placeholder="e.g. 50000"
            onChange={(e) =>
              setIncome(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <div className="card">
          <div className="card-title">MONTHLY EXPENSES</div>

          <label>Label</label>
          <input
            type="text"
            value={expenseLabel}
            placeholder="Rent, Utilities, Food"
            onChange={(e) => setExpenseLabel(e.target.value)}
          />

          <label>Amount (LKR)</label>
          <input
            type="number"
            value={expenseAmount}
            placeholder="e.g. 30000"
            onChange={(e) =>
              setExpenseAmount(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />

          <button onClick={addExpense}>+ ADD EXPENSE</button>

          {expenses.map((item, index) => (
            <div key={index} style={{ marginTop: "12px" }}>
              {item.label} - {item.amount} LKR
              <button
                style={{ marginTop: "6px" }}
                onClick={() => removeExpense(index)}
              >
                REMOVE
              </button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">LOAN PAYMENT AMOUNT</div>

          <label>Label</label>
          <input
            type="text"
            value={loanLabel}
            placeholder="Personal Loan, Car Loan"
            onChange={(e) => setLoanLabel(e.target.value)}
          />

          <label>Amount (LKR per month)</label>
          <input
            type="number"
            value={loanAmount}
            placeholder="e.g. 15000"
            onChange={(e) =>
              setLoanAmount(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />

          <button onClick={addLoan}>+ ADD LOAN</button>

          {/* List */}
          {loans.map((item, index) => (
            <div key={index} style={{ marginTop: "12px" }}>
              {item.label} - {item.amount} LKR
              <button
                style={{ marginTop: "6px" }}
                onClick={() => removeLoan(index)}
              >
                REMOVE
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: "40px" }}>
          <div className="card-title">PREVIEW</div>

          <p><strong>Income:</strong> {income || "Not entered"} LKR</p>
          <p><strong>Total Expenses:</strong> {totalExpenses} LKR</p>
          <p><strong>Total Loans:</strong> {totalLoans} LKR</p>
          <p><strong>Balance:</strong> {balance} LKR</p>

          <button>SAVE DATA</button>
        </div>

      </div>
    </PageLayout>
  );
}