import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

interface MonthSnapshot { month: number; label: string; totalDebt: number; interestPaid: number; principalPaid: number; }
interface StrategyResult { strategy: "avalanche" | "snowball"; monthlyPayment: number; totalInterestPaid: number; totalPaid: number; monthsToPayoff: number; payoffDate: string; explanation: string; schedule: MonthSnapshot[]; }
interface StrategyResponse { recommended: "avalanche" | "snowball"; monthlyBudget: number; totalDebt: number; income: number; totalExpenses: number; availableMonthly: number; avalanche: StrategyResult; snowball: StrategyResult; }
interface FinanceData { income: number; totalExpenses: number; totalDebt: number; totalLoans: number; availableMonthly: number; loans: { label: string; balance: number; interestRate: number; minimumPayment: number }[]; expenses: { label: string; amount: number }[]; goals: { preferredStrategy: string; extraMonthly: number }; savedAt: string; }
type ExportStatus = "idle" | "generating" | "done" | "error";

const fmt = (n: number) => n.toLocaleString();
function todayFormatted() { return new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }); }

function generateCSV(finance: FinanceData, strategy: StrategyResponse, sel: "avalanche" | "snowball"): string {
  const rec  = strategy[sel];
  const rows: string[][] = [];
  const push = (...cols: (string | number)[]) => rows.push(cols.map((c) => `"${c}"`));
  push("PAYWISE - DEBT REPAYMENT PLAN"); push("Generated", todayFormatted()); push("Strategy", sel.toUpperCase()); push("");
  push("FINANCIAL SUMMARY");
  push("Monthly Income (LKR)", finance.income); push("Monthly Expenses (LKR)", finance.totalExpenses);
  push("Total Debt (LKR)", finance.totalDebt); push("Monthly Minimums (LKR)", finance.totalLoans);
  push("Available for Repayment (LKR)", finance.availableMonthly); push("");
  push("LOANS"); push("Label", "Balance (LKR)", "Interest Rate (%)", "Minimum Payment (LKR)");
  finance.loans.forEach((l) => push(l.label, l.balance, l.interestRate, l.minimumPayment)); push("");
  push("REPAYMENT STRATEGY", sel.toUpperCase());
  push("Monthly Budget (LKR)", rec.monthlyPayment); push("Total Interest Paid (LKR)", rec.totalInterestPaid);
  push("Total Amount Paid (LKR)", rec.totalPaid); push("Months to Payoff", rec.monthsToPayoff);
  push("Projected Payoff Date", rec.payoffDate); push("");
  push("MONTH-BY-MONTH SCHEDULE"); push("Month", "Remaining Debt (LKR)", "Interest This Month (LKR)", "Principal Paid (LKR)");
  rec.schedule.forEach((s) => push(s.label, s.totalDebt, s.interestPaid, s.principalPaid));
  return rows.map((r) => r.join(",")).join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CheckItem({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid #000", background: "#000", flexShrink: 0 }} />
      <span style={{ fontSize: "0.88rem" }}>{label}</span>
    </div>
  );
}

export default function ExportPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [finance,  setFinance]  = useState<FinanceData | null>(null);
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null);
  const [sel,      setSel]      = useState<"avalanche" | "snowball">("avalanche");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");

  const fetchAll = useCallback(async () => {
    if (!userName) { navigate("/login"); return; }
    setLoadState("loading");
    try {
      const [finRes, stratRes] = await Promise.all([
        fetch(`http://localhost:5000/api/finance/${userName}`),
        fetch(`http://localhost:5000/api/finance/strategy/${userName}`),
      ]);
      if (!finRes.ok || !stratRes.ok) throw new Error();
      const { data: finData }    = await finRes.json();
      const stratData: StrategyResponse = await stratRes.json();
      setFinance(finData); setStrategy(stratData); setSel(stratData.recommended);
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [navigate, userName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = () => {
    if (!finance || !strategy) return;
    setExportStatus("generating");
    try {
      const csv = generateCSV(finance, strategy, sel);
      downloadCSV(csv, `paywise-repayment-${sel}-${new Date().toISOString().slice(0, 10)}.csv`);
      setExportStatus("done");
    } catch { setExportStatus("error"); }
  };

  if (loadState === "loading") return (
    <PageLayout><div className="page-content" style={{ alignItems: "center" }}>
      <div className="app-title">LOADING…</div>
    </div></PageLayout>
  );

  if (loadState === "error" || !finance || !strategy) return (
    <PageLayout><div className="page-content">
      <div className="app-title">EXPORT</div>
      <div className="card">
        <p style={{ color: "red" }}>Could not load data. Please enter financial data first.</p>
        <button onClick={() => navigate("/input")} style={{ marginTop: "12px" }}>GO TO DATA INPUT</button>
      </div>
    </div></PageLayout>
  );

  const rec = strategy[sel];

  return (
    <PageLayout>
      <div className="page-content">
        <div className="app-title">EXPORT</div>
        <div className="card">
          <div className="card-title">STRATEGY TO EXPORT</div>
          <div className="grid-2">
            {(["avalanche", "snowball"] as const).map((s) => (
              <div key={s} onClick={() => { setSel(s); setExportStatus("idle"); }}
                className={`strategy-card${sel === s ? " strategy-card--selected" : ""}`}>
                {strategy.recommended === s && <div className="badge">RECOMMENDED</div>}
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>{s.toUpperCase()}</div>
                <div className="text-muted" style={{ lineHeight: 1.7 }}>
                  Payoff: <strong>{strategy[s].payoffDate}</strong><br />
                  Interest: <strong>LKR {fmt(strategy[s].totalInterestPaid)}</strong><br />
                  Duration: <strong>{strategy[s].monthsToPayoff} months</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">CSV CONTENTS</div>
          <CheckItem label="Financial Summary (Income, Expenses, Total Debt)" />
          <CheckItem label={`Loan Details (${finance.loans.length} loan${finance.loans.length !== 1 ? "s" : ""})`} />
          <CheckItem label={`Repayment Strategy — ${sel.toUpperCase()}`} />
          <CheckItem label={`Full Payment Schedule (${rec.monthsToPayoff} months)`} />
          <p className="text-hint" style={{ marginTop: "10px" }}>
            Opens in Excel, Google Sheets, Numbers, or any spreadsheet application.
          </p>
        </div>
        <div className="card">
          <div className="card-title">FILE PREVIEW</div>
          <div className="preview-box">
            <div className="text-hint" style={{ marginBottom: "8px" }}>
              paywise-repayment-{sel}-{new Date().toISOString().slice(0, 10)}.csv
            </div>
            <div style={{ borderTop: "1px solid #ddd", paddingTop: "10px" }}>
              "PAYWISE - DEBT REPAYMENT PLAN"<br />
              "Generated","{todayFormatted()}"<br />
              "Strategy","{sel.toUpperCase()}"<br />
              ...<br />
              "Monthly Income (LKR)","{fmt(finance.income)}"<br />
              "Total Debt (LKR)","{fmt(finance.totalDebt)}"<br />
              <span className="text-hint">
                ... + {finance.loans.length} loan{finance.loans.length !== 1 ? "s" : ""} + {rec.monthsToPayoff} monthly rows
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <button onClick={handleExport} disabled={exportStatus === "generating"} className="btn-primary">
            {exportStatus === "generating" ? "GENERATING..." : "DOWNLOAD CSV"}
          </button>
          {exportStatus === "done"  && <p style={{ color: "green", marginTop: "10px", textAlign: "center" }}>CSV downloaded successfully.</p>}
          {exportStatus === "error" && <p style={{ color: "red",   marginTop: "10px", textAlign: "center" }}>Export failed. Please try again.</p>}
        </div>

        <div className="page-actions">
          <button onClick={() => navigate("/dashboard")}>← BACK TO DASHBOARD</button>
          <button className="btn-primary" onClick={() => navigate("/progress")}>VIEW PROGRESS →</button>
        </div>

      </div>
    </PageLayout>
  );
}