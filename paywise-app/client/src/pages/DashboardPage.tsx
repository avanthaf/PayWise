import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

interface FinanceSummary {
  income: number; totalExpenses: number; totalDebt: number; totalLoans: number;
  availableMonthly: number;
  loans: { label: string; balance: number; interestRate: number }[];
  goals: { preferredStrategy: string; extraMonthly: number };
  savedAt: string;
}
interface StrategySummary {
  recommended: "avalanche" | "snowball";
  monthlyBudget: number;
  avalanche: { monthsToPayoff: number; payoffDate: string; totalInterestPaid: number };
  snowball:  { monthsToPayoff: number; payoffDate: string; totalInterestPaid: number };
}
type LoadState = "loading" | "ready" | "no-data" | "error";

const fmt = (n: number) => n.toLocaleString();
function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

function SummaryTile({ label, value, sub, inverted, warn }: {
  label: string; value: string; sub?: string; inverted?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      border: "2px solid #000", padding: "16px",
      background: inverted ? "#000" : warn ? "#fff8f0" : "#fff",
      color: inverted ? "#fff" : "#000",
      display: "flex", flexDirection: "column", gap: "4px",
    }}>
      <div className={inverted ? "text-hint" : "text-muted"} style={{ color: inverted ? "rgba(255,255,255,0.65)" : undefined }}>
        {label}
      </div>
      <div style={{ fontSize: "1.2rem", fontWeight: "bold", lineHeight: 1.2 }}>{value}</div>
      {sub && <div className="text-hint" style={{ color: inverted ? "rgba(255,255,255,0.55)" : undefined }}>{sub}</div>}
    </div>
  );
}

function NavCard({ title, description, meta, badge, path, disabled, inverted, onClick }: {
  title: string; description: string; meta?: string; badge?: string;
  path: string; disabled?: boolean; inverted?: boolean; onClick: (p: string) => void;
}) {
  return (
    <div
      onClick={() => !disabled && onClick(path)}
      className={`strategy-card${inverted ? "" : ""}`}
      style={{
        border: "2px solid #000", padding: "20px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        background: inverted ? "#000" : "#fff",
        color: inverted ? "#fff" : "#000",
        display: "flex", flexDirection: "column", gap: "6px",
        transition: "background 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLDivElement).style.background = inverted ? "#222" : "#f5f5f5"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = inverted ? "#000" : "#fff"; }}
    >
      {badge && <div className="badge"
        style={{ background: inverted ? "#fff" : "#000", color: inverted ? "#000" : "#fff" }}>{badge}</div>}
      <div style={{ fontWeight: "bold", fontSize: "1rem", letterSpacing: "0.05rem" }}>{title}</div>
      <div className="text-hint" style={{ opacity: 0.7, lineHeight: 1.5, color: inverted ? "rgba(255,255,255,0.7)" : undefined }}>
        {description}
      </div>
      {meta && (
        <div style={{ marginTop: "8px", fontSize: "0.78rem", fontWeight: "bold",
          borderTop: `1px solid ${inverted ? "#444" : "#e0e0e0"}`, paddingTop: "8px" }}>
          {meta}
        </div>
      )}
      <div style={{ marginTop: "auto", fontSize: "0.75rem", opacity: 0.45, textAlign: "right", paddingTop: "10px" }}>→</div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [finance, setFinance]   = useState<FinanceSummary | null>(null);
  const [strategy, setStrategy] = useState<StrategySummary | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const fetchAll = useCallback(async () => {
    if (!userName) { navigate("/login"); return; }
    setLoadState("loading");
    try {
      const [finRes, stratRes] = await Promise.all([
        fetch(`http://localhost:5000/api/finance/${userName}`),
        fetch(`http://localhost:5000/api/finance/strategy/${userName}`),
      ]);
      if (finRes.status === 404) { setLoadState("no-data"); return; }
      if (!finRes.ok) throw new Error();
      const { data: finData } = await finRes.json();
      setFinance(finData);
      if (stratRes.ok) { const stratData = await stratRes.json(); setStrategy(stratData); }
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [navigate, userName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const rec       = strategy?.recommended ?? "avalanche";
  const recResult = strategy ? strategy[rec] : null;
  const hasLoans  = (finance?.loans?.length ?? 0) > 0;
  const debtToIncome = finance?.income ? pct(finance.totalLoans, finance.income) : null;
  const avgRate = finance?.loans?.length
    ? finance.loans.reduce((s, l) => s + l.interestRate, 0) / finance.loans.length : null;
  const lastSaved = finance?.savedAt
    ? new Date(finance.savedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;

  if (loadState === "loading") return (
    <PageLayout><div className="page-content" style={{ alignItems: "center" }}>
      <div className="app-title">LOADING DASHBOARD…</div>
    </div></PageLayout>
  );

  if (loadState === "error") return (
    <PageLayout><div className="page-content">
      <div className="app-title">DASHBOARD</div>
      <div className="card">
        <p style={{ color: "red" }}>⚠ Could not connect to the server. Make sure it is running.</p>
        <button onClick={fetchAll} style={{ marginTop: "12px" }}>RETRY</button>
      </div>
    </div></PageLayout>
  );

  if (loadState === "no-data") return (
    <PageLayout><div className="page-content">
      <div className="app-title">PAYWISE</div>
      <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "12px" }}>Welcome to Paywise</div>
        <p style={{ color: "#555", marginBottom: "24px" }}>
          You haven't entered any financial data yet. Start by adding your income,
          expenses, and loans to generate your personalised repayment plan.
        </p>
        <button className="btn-primary" onClick={() => navigate("/input")}
          style={{ maxWidth: "320px", margin: "0 auto" }}>
          GET STARTED →
        </button>
      </div>
    </div></PageLayout>
  );

  return (
    <PageLayout>
      <div className="page-content">


        <div className="app-title">DASHBOARD</div>

        <div className="card">
          <div className="card-title">FINANCIAL OVERVIEW</div>
          <div className="grid-3">
            <SummaryTile label="Monthly Income"       value={`LKR ${fmt(finance!.income)}`} />
            <SummaryTile label="Monthly Expenses"     value={`LKR ${fmt(finance!.totalExpenses)}`}
              sub={`${pct(finance!.totalExpenses, finance!.income)}% of income`} />
            <SummaryTile label="Total Debt"           value={`LKR ${fmt(finance!.totalDebt)}`}
              sub={`${finance!.loans.length} loan${finance!.loans.length !== 1 ? "s" : ""}`} inverted />
            <SummaryTile label="Monthly Debt Minimums" value={`LKR ${fmt(finance!.totalLoans)}`}
              sub={debtToIncome !== null ? `${debtToIncome}% debt-to-income ratio` : undefined}
              warn={debtToIncome !== null && debtToIncome > 40} />
            <SummaryTile label="Available for Repayment" value={`LKR ${fmt(finance!.availableMonthly)}`}
              sub="After expenses & minimums" />
            {avgRate !== null && (
              <SummaryTile label="Avg. Interest Rate" value={`${avgRate.toFixed(1)}% APR`}
                sub="Weighted across all loans" />
            )}
          </div>
          {debtToIncome !== null && debtToIncome > 40 && (
            <div className="warn-banner">
              ⚠ Your debt-to-income ratio is <strong>{debtToIncome}%</strong>. Financial advisors
              generally recommend keeping this below 40%. Consider reducing discretionary expenses
              or increasing your income to accelerate repayment.
            </div>
          )}
        </div>

        {recResult && (
          <div style={{
            border: "2px solid #000", padding: "16px 20px", background: "#000", color: "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "12px",
          }}>
            <div>
              <div className="text-hint" style={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>RECOMMENDED STRATEGY</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{rec.toUpperCase()} METHOD</div>
              <div className="text-hint" style={{ color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
                {rec === "avalanche"
                  ? "Highest interest rate first — minimises total interest paid"
                  : "Smallest balance first — builds momentum with quick wins"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {[
                { label: "DEBT-FREE BY",    val: recResult.payoffDate },
                { label: "TOTAL INTEREST",  val: `LKR ${fmt(recResult.totalInterestPaid)}` },
                { label: "MONTHS LEFT",     val: String(recResult.monthsToPayoff) },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "right" }}>
                  <div className="text-hint" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasLoans && (
          <div className="card">
            <div className="card-title">YOUR LOANS</div>
            {finance!.loans.map((loan, i) => {
              const balPct = pct(loan.balance, finance!.totalDebt);
              return (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < finance!.loans.length - 1 ? "1px solid #eee" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "bold" }}>{loan.label}</span>
                    <span>LKR {fmt(loan.balance)}</span>
                  </div>
                  <div className="text-muted" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>{loan.interestRate}% APR</span>
                    <span>{balPct}% of total debt</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${balPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card">
          <div className="card-title">NAVIGATE</div>
          <div className="grid-2">
            <NavCard title="DATA INPUT"  path="/input"    onClick={navigate}
              description="Update your income, expenses, loans, and repayment preferences."
              meta={lastSaved ? `Last saved: ${lastSaved}` : undefined} />
            <NavCard title="STRATEGY"    path="/strategy" onClick={navigate} disabled={!hasLoans}
              description="Compare Avalanche vs Snowball and view your full payment schedule."
              meta={recResult ? `${rec.toUpperCase()} recommended · ${recResult.monthsToPayoff} months` : undefined}
              badge={recResult ? "PLAN READY" : undefined} />
            <NavCard title="PROGRESS"    path="/progress" onClick={navigate} disabled={!hasLoans}
              description="Track projected debt reduction over time with charts and milestones."
              meta={recResult ? `Debt-free by ${recResult.payoffDate}` : undefined} />
            <NavCard title="EXPORT"      path="/export"   onClick={navigate} disabled={!hasLoans}
              description="Download your repayment plan as a CSV spreadsheet." inverted />
          </div>
          {!hasLoans && (
            <p className="text-hint" style={{ marginTop: "12px", textAlign: "center" }}>
              Strategy, Progress, and Export require at least one loan to be entered.
            </p>
          )}
        </div>

      </div>
    </PageLayout>
  );
}