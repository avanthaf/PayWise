import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import { useNavigate } from "react-router-dom";

interface Expense {
  label: string;
  amount: number;
}

interface Loan {
  label: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

interface Goals {
  preferredStrategy: "avalanche" | "snowball" | "auto";
  extraMonthly: number;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

const FIELD_STYLE: React.CSSProperties = { marginBottom: "0" };

export default function InputPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [income, setIncome] = useState<number | "">("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expLabel, setExpLabel] = useState("");
  const [expAmount, setExpAmount] = useState<number | "">("");

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanLabel, setLoanLabel] = useState("");
  const [loanBalance, setLoanBalance] = useState<number | "">("");
  const [loanRate, setLoanRate] = useState<number | "">("");
  const [loanMinimum, setLoanMinimum] = useState<number | "">("");

  const [goals, setGoals] = useState<Goals>({
    preferredStrategy: "auto",
    extraMonthly: 0,
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!userName) {
      navigate("/login");
      return;
    }
    loadExistingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExistingData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/finance/${userName}`);
      if (!res.ok) return; // 404 = first time, nothing to load
      const { data } = await res.json();
      if (data.income) setIncome(data.income);
      if (data.expenses?.length) setExpenses(data.expenses);
      if (data.loans?.length) setLoans(data.loans);
      if (data.goals) setGoals(data.goals);
    } catch {
      setLoadError("Could not load existing data.");
    }
  };

  const addExpense = () => {
    if (!expLabel || expAmount === "") return;
    setExpenses([...expenses, { label: expLabel, amount: Number(expAmount) }]);
    setExpLabel("");
    setExpAmount("");
  };
  const removeExpense = (i: number) =>
    setExpenses(expenses.filter((_, idx) => idx !== i));

  const addLoan = () => {
    if (!loanLabel || loanBalance === "" || loanRate === "" || loanMinimum === "") return;
    setLoans([
      ...loans,
      {
        label: loanLabel,
        balance: Number(loanBalance),
        interestRate: Number(loanRate),
        minimumPayment: Number(loanMinimum),
      },
    ]);
    setLoanLabel("");
    setLoanBalance("");
    setLoanRate("");
    setLoanMinimum("");
  };
  const removeLoan = (i: number) =>
    setLoans(loans.filter((_, idx) => idx !== i));

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMinimums = loans.reduce((s, l) => s + l.minimumPayment, 0);
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0);
  const available =
    income !== ""
      ? Number(income) - totalExpenses - totalMinimums + (goals.extraMonthly || 0)
      : 0;

  const handleSave = async () => {
    if (!userName) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("http://localhost:5000/api/finance/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          income: Number(income),
          expenses,
          loans,
          goals,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    }
  };

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

        {loadError && (
          <p style={{ color: "orange", marginBottom: "8px" }}>{loadError}</p>
        )}

        <div className="app-title">FINANCIAL DATA</div>

        <div className="card">
          <div className="card-title">MONTHLY INCOME</div>
          <label>Amount (LKR)</label>
          <input
            type="number"
            value={income}
            placeholder="e.g. 75000"
            style={FIELD_STYLE}
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
            value={expLabel}
            placeholder="Rent, Utilities, Food…"
            onChange={(e) => setExpLabel(e.target.value)}
          />
          <label>Amount (LKR)</label>
          <input
            type="number"
            value={expAmount}
            placeholder="e.g. 15000"
            style={FIELD_STYLE}
            onChange={(e) =>
              setExpAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <button style={{ marginTop: "12px" }} onClick={addExpense}>
            + ADD EXPENSE
          </button>

          {expenses.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              {expenses.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #ccc",
                    paddingTop: "8px",
                    marginTop: "8px",
                  }}
                >
                  <span>
                    {item.label} — <strong>{item.amount.toLocaleString()} LKR</strong>
                  </span>
                  <button
                    style={{ width: "fit-content", padding: "4px 12px", fontSize: "0.85rem" }}
                    onClick={() => removeExpense(i)}
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">LOANS / DEBTS</div>
          <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
            Enter each loan separately. All four fields are required for the
            repayment engine to generate an accurate plan.
          </p>

          <label>Loan Name</label>
          <input
            type="text"
            value={loanLabel}
            placeholder="Personal Loan, Credit Card, Car Loan…"
            onChange={(e) => setLoanLabel(e.target.value)}
          />

          <label>Outstanding Balance (LKR)</label>
          <input
            type="number"
            value={loanBalance}
            placeholder="e.g. 250000"
            onChange={(e) =>
              setLoanBalance(e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <label>Annual Interest Rate (%)</label>
          <input
            type="number"
            value={loanRate}
            placeholder="e.g. 18.5"
            step="0.1"
            onChange={(e) =>
              setLoanRate(e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <label>Minimum Monthly Payment (LKR)</label>
          <input
            type="number"
            value={loanMinimum}
            placeholder="e.g. 5000"
            style={FIELD_STYLE}
            onChange={(e) =>
              setLoanMinimum(e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <button style={{ marginTop: "12px" }} onClick={addLoan}>
            + ADD LOAN
          </button>

          {loans.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              {loans.map((loan, i) => (
                <div
                  key={i}
                  style={{
                    borderTop: "1px solid #ccc",
                    paddingTop: "10px",
                    marginTop: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{loan.label}</strong>
                    <button
                      style={{ width: "fit-content", padding: "4px 12px", fontSize: "0.85rem" }}
                      onClick={() => removeLoan(i)}
                    >
                      REMOVE
                    </button>
                  </div>
                  <div style={{ fontSize: "0.9rem", marginTop: "4px", color: "#333" }}>
                    Balance: {loan.balance.toLocaleString()} LKR &nbsp;|&nbsp;
                    Rate: {loan.interestRate}% APR &nbsp;|&nbsp;
                    Min: {loan.minimumPayment.toLocaleString()} LKR/mo
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">GOALS &amp; PREFERENCES</div>

          <label>Repayment Strategy</label>
          <select
            value={goals.preferredStrategy}
            onChange={(e) =>
              setGoals({ ...goals, preferredStrategy: e.target.value as Goals["preferredStrategy"] })
            }
            style={{
              width: "100%",
              padding: "0.8rem",
              border: "2px solid #9ca3af",
              fontFamily: "monospace",
              fontSize: "1rem",
              marginBottom: "1rem",
              background: "#fff",
            }}
          >
            <option value="auto">AUTO — Let the system recommend</option>
            <option value="avalanche">AVALANCHE — Pay highest interest first (saves most money)</option>
            <option value="snowball">SNOWBALL — Pay smallest balance first (builds momentum)</option>
          </select>

          <label>Extra Monthly Contribution (LKR)</label>
          <input
            type="number"
            value={goals.extraMonthly || ""}
            placeholder="0 — amount above your minimums you can add"
            style={FIELD_STYLE}
            onChange={(e) =>
              setGoals({
                ...goals,
                extraMonthly: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
          />
        </div>

        <div className="card" style={{ marginBottom: "40px" }}>
          <div className="card-title">SUMMARY</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Monthly Income</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {income !== "" ? Number(income).toLocaleString() : "—"} LKR
              </p>
            </div>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Total Expenses</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {totalExpenses.toLocaleString()} LKR
              </p>
            </div>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Total Debt</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {totalDebt.toLocaleString()} LKR
              </p>
            </div>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Sum of Minimums</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {totalMinimums.toLocaleString()} LKR/mo
              </p>
            </div>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Extra Contribution</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {(goals.extraMonthly || 0).toLocaleString()} LKR/mo
              </p>
            </div>
            <div>
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Available for Debt</p>
              <p
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  color: available >= 0 ? "#000" : "red",
                }}
              >
                {available.toLocaleString()} LKR/mo
              </p>
            </div>
          </div>

          {available < 0 && (
            <p style={{ color: "red", marginTop: "12px", fontSize: "0.9rem" }}>
              ⚠ Your expenses and loan minimums exceed your income. Please review your
              entries or reduce your extra contribution.
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            style={{ marginTop: "20px" }}
          >
            {saveStatus === "saving" ? "SAVING..." : "SAVE DATA"}
          </button>

          {saveStatus === "success" && (
            <p style={{ color: "green", marginTop: "8px" }}>
              ✓ Data saved. Head to Strategy to see your plan.
            </p>
          )}
          {saveStatus === "error" && (
            <p style={{ color: "red", marginTop: "8px" }}>
              ✗ Failed to save. Please try again.
            </p>
          )}

          {saveStatus === "success" && (
            <button
              onClick={() => navigate("/strategy")}
              style={{ marginTop: "12px", background: "#000", color: "#fff" }}
            >
              VIEW REPAYMENT STRATEGY →
            </button>
          )}
        </div>

      </div>
    </PageLayout>
  );
}