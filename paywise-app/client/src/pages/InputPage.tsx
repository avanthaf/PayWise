import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import { useNavigate } from "react-router-dom";

interface Expense { label: string; amount: number; }
interface Loan { label: string; balance: number; interestRate: number; minimumPayment: number; }
interface Goals { preferredStrategy: "avalanche" | "snowball" | "auto"; extraMonthly: number; }
type SaveStatus = "idle" | "saving" | "success" | "error";

export default function InputPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [income,     setIncome]     = useState<number | "">("");
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [expLabel,   setExpLabel]   = useState("");
  const [expAmount,  setExpAmount]  = useState<number | "">("");
  const [loans,      setLoans]      = useState<Loan[]>([]);
  const [loanLabel,  setLoanLabel]  = useState("");
  const [loanBalance,setLoanBalance]= useState<number | "">("");
  const [loanRate,   setLoanRate]   = useState<number | "">("");
  const [loanMinimum,setLoanMinimum]= useState<number | "">("");
  const [goals,      setGoals]      = useState<Goals>({ preferredStrategy: "auto", extraMonthly: 0 });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loadError,  setLoadError]  = useState("");
  const [expErrors,  setExpErrors]  = useState<{ label?: string; amount?: string }>({});
  const [loanErrors, setLoanErrors] = useState<{ label?: string; balance?: string; rate?: string; minimum?: string }>();
  const [saveError,  setSaveError]  = useState("");

  useEffect(() => {
    if (!userName) { navigate("/login"); return; }
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/finance/${userName}`);
      if (!res.ok) return;
      const { data } = await res.json();
      if (data.income)            setIncome(data.income);
      if (data.expenses?.length)  setExpenses(data.expenses);
      if (data.loans?.length)     setLoans(data.loans);
      if (data.goals)             setGoals(data.goals);
    } catch { setLoadError("Could not load existing data."); }
  };

  const addExpense = () => {
    const errs: { label?: string; amount?: string } = {};
    if (!expLabel)        errs.label  = "Please enter a label.";
    if (expAmount === "") errs.amount = "Please enter an amount.";
    if (Object.keys(errs).length) { setExpErrors(errs); return; }
    setExpErrors({});
    setExpenses([...expenses, { label: expLabel, amount: Number(expAmount) }]);
    setExpLabel(""); setExpAmount("");
  };
  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));

  const addLoan = () => {
    const errs: { label?: string; balance?: string; rate?: string; minimum?: string } = {};
    if (!loanLabel)         errs.label   = "Please enter a loan name.";
    if (loanBalance === "") errs.balance  = "Please enter the outstanding balance.";
    if (loanRate === "")    errs.rate     = "Please enter the annual interest rate.";
    if (loanMinimum === "") errs.minimum  = "Please enter the minimum monthly payment.";
    if (Object.keys(errs).length) { setLoanErrors(errs); return; }
    setLoanErrors({});
    setLoans([...loans, {
      label: loanLabel,
      balance: Number(loanBalance),
      interestRate: Number(loanRate),
      minimumPayment: Number(loanMinimum),
    }]);
    setLoanLabel(""); setLoanBalance(""); setLoanRate(""); setLoanMinimum("");
  };
  const removeLoan = (i: number) => setLoans(loans.filter((_, idx) => idx !== i));

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMinimums = loans.reduce((s, l) => s + l.minimumPayment, 0);
  const totalDebt     = loans.reduce((s, l) => s + l.balance, 0);
  const available     = income !== "" ? Number(income) - totalExpenses - totalMinimums + (goals.extraMonthly || 0) : 0;

  const handleSave = async () => {
    if (!userName) return;
    if (income === "") { setSaveError("Please enter your monthly income before saving."); return; }
    if (loans.length === 0) { setSaveError("Please add at least one loan before saving."); return; }
    setSaveError("");
    setSaveStatus("saving");
    try {
      const res = await fetch("http://localhost:5000/api/finance/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, income: Number(income), expenses, loans, goals }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
  };

  return (
    <PageLayout>
      <div className="page-content">
        {loadError && <p style={{ color: "orange" }}>{loadError}</p>}

        <div className="app-title">FINANCIAL DATA</div>
        <div className="card">
          <div className="card-title">MONTHLY INCOME</div>
          <label>Amount (LKR)</label>
          <input type="number" value={income} placeholder="e.g. 75000"
            onChange={(e) => setIncome(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div className="card">
          <div className="card-title">MONTHLY EXPENSES</div>
          <label>Label</label>
          <input type="text" value={expLabel} placeholder="Rent, Utilities, Food…"
            style={{ borderColor: expErrors?.label ? "#c00" : undefined }}
            onChange={(e) => { setExpLabel(e.target.value); setExpErrors({}); }} />
          {expErrors?.label && <p className="field-error">{expErrors.label}</p>}

          <label>Amount (LKR)</label>
          <input type="number" value={expAmount} placeholder="e.g. 15000"
            style={{ marginBottom: 0, borderColor: expErrors?.amount ? "#c00" : undefined }}
            onChange={(e) => { setExpAmount(e.target.value === "" ? "" : Number(e.target.value)); setExpErrors({}); }} />
          {expErrors?.amount && <p className="field-error">{expErrors.amount}</p>}
          <button className="btn-add" onClick={addExpense}>+ ADD EXPENSE</button>
          {expenses.map((item, i) => (
            <div key={i} className="list-row">
              <span>{item.label} — <strong>{item.amount.toLocaleString()} LKR</strong></span>
              <button className="btn-sm" onClick={() => removeExpense(i)}>REMOVE</button>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">LOANS / DEBTS</div>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Enter each loan separately. All four fields are required for the repayment engine.
          </p>

          <label>Loan Name</label>
          <input type="text" value={loanLabel} placeholder="Personal Loan, Credit Card, Car Loan…"
            style={{ borderColor: loanErrors?.label ? "#c00" : undefined }}
            onChange={(e) => { setLoanLabel(e.target.value); setLoanErrors({}); }} />
          {loanErrors?.label && <p className="field-error">{loanErrors.label}</p>}

          <label>Outstanding Balance (LKR)</label>
          <input type="number" value={loanBalance} placeholder="e.g. 250000"
            style={{ borderColor: loanErrors?.balance ? "#c00" : undefined }}
            onChange={(e) => { setLoanBalance(e.target.value === "" ? "" : Number(e.target.value)); setLoanErrors({}); }} />
          {loanErrors?.balance && <p className="field-error">{loanErrors.balance}</p>}

          <label>Annual Interest Rate (%)</label>
          <input type="number" value={loanRate} placeholder="e.g. 18.5" step="0.1"
            style={{ borderColor: loanErrors?.rate ? "#c00" : undefined }}
            onChange={(e) => { setLoanRate(e.target.value === "" ? "" : Number(e.target.value)); setLoanErrors({}); }} />
          {loanErrors?.rate && <p className="field-error">{loanErrors.rate}</p>}

          <label>Minimum Monthly Payment (LKR)</label>
          <input type="number" value={loanMinimum} placeholder="e.g. 5000"
            style={{ marginBottom: 0, borderColor: loanErrors?.minimum ? "#c00" : undefined }}
            onChange={(e) => { setLoanMinimum(e.target.value === "" ? "" : Number(e.target.value)); setLoanErrors({}); }} />
          {loanErrors?.minimum && <p className="field-error">{loanErrors.minimum}</p>}

          <button className="btn-add" onClick={addLoan}>+ ADD LOAN</button>

          {loans.map((loan, i) => (
            <div key={i} className="list-row--block">
              <div className="list-row" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
                <strong>{loan.label}</strong>
                <button className="btn-sm" onClick={() => removeLoan(i)}>REMOVE</button>
              </div>
              <div className="text-muted" style={{ marginTop: "4px" }}>
                Balance: {loan.balance.toLocaleString()} LKR &nbsp;|&nbsp;
                Rate: {loan.interestRate}% APR &nbsp;|&nbsp;
                Min: {loan.minimumPayment.toLocaleString()} LKR/mo
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">GOALS &amp; PREFERENCES</div>
          <label>Repayment Strategy</label>
          <select value={goals.preferredStrategy}
            onChange={(e) => setGoals({ ...goals, preferredStrategy: e.target.value as Goals["preferredStrategy"] })}>
            <option value="auto">AUTO — Let the system recommend</option>
            <option value="avalanche">AVALANCHE — Pay highest interest first (saves most money)</option>
            <option value="snowball">SNOWBALL — Pay smallest balance first (builds momentum)</option>
          </select>

          <label>Extra Monthly Contribution (LKR)</label>
          <input type="number" value={goals.extraMonthly || ""} style={{ marginBottom: 0 }}
            placeholder="0 — amount above your minimums you can add"
            onChange={(e) => setGoals({ ...goals, extraMonthly: e.target.value === "" ? 0 : Number(e.target.value) })} />
        </div>
        <div className="card" style={{ marginBottom: "40px" }}>
          <div className="card-title">SUMMARY</div>
          <div className="grid-2">
            <div>
              <p className="text-muted">Monthly Income</p>
              <p style={{ fontWeight: "bold" }}>{income !== "" ? Number(income).toLocaleString() : "—"} LKR</p>
            </div>
            <div>
              <p className="text-muted">Total Expenses</p>
              <p style={{ fontWeight: "bold" }}>{totalExpenses.toLocaleString()} LKR</p>
            </div>
            <div>
              <p className="text-muted">Total Debt</p>
              <p style={{ fontWeight: "bold" }}>{totalDebt.toLocaleString()} LKR</p>
            </div>
            <div>
              <p className="text-muted">Sum of Minimums</p>
              <p style={{ fontWeight: "bold" }}>{totalMinimums.toLocaleString()} LKR/mo</p>
            </div>
            <div>
              <p className="text-muted">Extra Contribution</p>
              <p style={{ fontWeight: "bold" }}>{(goals.extraMonthly || 0).toLocaleString()} LKR/mo</p>
            </div>
            <div>
              <p className="text-muted">Available for Debt</p>
              <p style={{ fontWeight: "bold", color: available >= 0 ? "#000" : "red" }}>
                {available.toLocaleString()} LKR/mo
              </p>
            </div>
          </div>

          {available < 0 && (
            <div className="warn-banner">
              ⚠ Your expenses and loan minimums exceed your income. Please review your entries
              or reduce your extra contribution.
            </div>
          )}

          {saveError && (
            <div className="warn-banner" style={{ marginTop: "16px", marginBottom: 0 }}>
              ⚠ {saveError}
            </div>
          )}

          <button onClick={handleSave} disabled={saveStatus === "saving"} style={{ marginTop: "20px" }}>
            {saveStatus === "saving" ? "SAVING..." : "SAVE DATA"}
          </button>

          {saveStatus === "success" && <p style={{ color: "green", marginTop: "8px" }}>✓ Data saved. Head to Strategy to see your plan.</p>}
          {saveStatus === "error"   && <p style={{ color: "red",   marginTop: "8px" }}>✗ Failed to save. Please try again.</p>}

          {saveStatus === "success" && (
            <button className="btn-primary" onClick={() => navigate("/strategy")} style={{ marginTop: "12px" }}>
              VIEW REPAYMENT STRATEGY →
            </button>
          )}
        </div>

      </div>
    </PageLayout>
  );
}