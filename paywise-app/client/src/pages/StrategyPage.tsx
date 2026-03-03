import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

interface MonthSnapshot { month: number; label: string; totalDebt: number; interestPaid: number; principalPaid: number; }
interface StrategyResult { strategy: "avalanche" | "snowball"; monthlyPayment: number; totalInterestPaid: number; totalPaid: number; monthsToPayoff: number; payoffDate: string; explanation: string; schedule: MonthSnapshot[]; }
interface StrategyResponse { recommended: "avalanche" | "snowball"; monthlyBudget: number; totalDebt: number; income: number; totalExpenses: number; availableMonthly: number; avalanche: StrategyResult; snowball: StrategyResult; }

const fmt = (n: number) => n.toLocaleString();

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ border: highlight ? "2px solid #000" : "1px solid #ccc", padding: "14px 16px", background: highlight ? "#f9f9f9" : "#fff" }}>
      <div className="text-muted">{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function StrategyCard({ result, isRecommended, isSelected, onSelect }: {
  result: StrategyResult; isRecommended: boolean; isSelected: boolean; onSelect: () => void;
}) {
  const title = result.strategy === "avalanche" ? "AVALANCHE" : "SNOWBALL";
  const subtitle = result.strategy === "avalanche" ? "Highest interest rate first" : "Smallest balance first";
  return (
    <div onClick={onSelect}
      className={`strategy-card${isSelected ? " strategy-card--selected" : ""}`}>
      {isRecommended && <div className="badge">RECOMMENDED</div>}
      <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px" }}>{title}</div>
      <div className="text-muted" style={{ marginBottom: "16px" }}>{subtitle}</div>
      <div className="grid-2">
        <StatBox label="Payoff Date"         value={result.payoffDate} />
        <StatBox label="Months to Payoff"    value={`${result.monthsToPayoff} mo`} />
        <StatBox label="Total Interest Paid" value={`LKR ${fmt(result.totalInterestPaid)}`} />
        <StatBox label="Total Amount Paid"   value={`LKR ${fmt(result.totalPaid)}`} />
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [data, setData]                   = useState<StrategyResponse | null>(null);
  const [selected, setSelected]           = useState<"avalanche" | "snowball">("avalanche");
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [showFullSchedule, setShowFull]   = useState(false);

  useEffect(() => {
    if (!userName) { navigate("/login"); return; }
    fetchStrategy();
  }, []);

  const fetchStrategy = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/finance/strategy/${userName}`);
      if (res.status === 404) { setError("No financial data found. Please enter your data first."); return; }
      if (res.status === 400) { const b = await res.json(); setError(b.error || "Could not generate a strategy."); return; }
      if (!res.ok) throw new Error();
      const body: StrategyResponse = await res.json();
      setData(body); setSelected(body.recommended);
    } catch { setError("Failed to load strategy. Make sure the server is running."); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <PageLayout><div className="page-content" style={{ alignItems: "center" }}>
      <div className="app-title">CALCULATING STRATEGY…</div>
      <p className="text-muted">Running repayment simulations for your profile.</p>
    </div></PageLayout>
  );

  if (error || !data) return (
    <PageLayout><div className="page-content">
      <div className="app-title">STRATEGY</div>
      <div className="card">
        <p style={{ color: "red" }}>⚠ {error || "An unexpected error occurred."}</p>
        <button onClick={() => navigate("/input")} style={{ marginTop: "12px" }}>GO TO DATA INPUT</button>
      </div>
    </div></PageLayout>
  );

  const activeResult  = selected === "avalanche" ? data.avalanche : data.snowball;
  const altResult     = selected === "avalanche" ? data.snowball   : data.avalanche;
  const interestSaving = altResult.totalInterestPaid - activeResult.totalInterestPaid;
  const monthDiff      = altResult.monthsToPayoff - activeResult.monthsToPayoff;
  const scheduleToShow = showFullSchedule ? activeResult.schedule : activeResult.schedule.slice(0, 12);

  return (
    <PageLayout>
      <div className="page-content">


        <div className="app-title">REPAYMENT STRATEGY</div>

        <div className="card">
          <div className="card-title">YOUR FINANCIAL SNAPSHOT</div>
          <div className="grid-3">
            <StatBox label="Monthly Income"          value={`LKR ${fmt(data.income)}`} />
            <StatBox label="Monthly Expenses"        value={`LKR ${fmt(data.totalExpenses)}`} />
            <StatBox label="Total Debt"              value={`LKR ${fmt(data.totalDebt)}`}              highlight />
            <StatBox label="Monthly Budget for Debt" value={`LKR ${fmt(data.monthlyBudget)}`}          highlight />
            <StatBox label="Available After Minimums" value={`LKR ${fmt(data.availableMonthly)}`} />
            <StatBox label="Recommended Strategy"    value={data.recommended.toUpperCase()}            highlight />
          </div>
        </div>

        {/* Strategy comparison */}
        <div className="card">
          <div className="card-title">CHOOSE YOUR STRATEGY</div>
          <p className="text-muted" style={{ marginTop: 0 }}>Click a strategy to see its full breakdown below.</p>
          <div className="grid-2">
            <StrategyCard result={data.avalanche} isRecommended={data.recommended === "avalanche"}
              isSelected={selected === "avalanche"} onSelect={() => setSelected("avalanche")} />
            <StrategyCard result={data.snowball}  isRecommended={data.recommended === "snowball"}
              isSelected={selected === "snowball"}  onSelect={() => setSelected("snowball")} />
          </div>
          {interestSaving !== 0 && (
            <div className="info-banner">
              {interestSaving > 0 ? (
                <>The <strong>{selected.toUpperCase()}</strong> strategy saves you{" "}
                  <strong>LKR {fmt(interestSaving)}</strong> in interest
                  {monthDiff !== 0 && <> and pays off your debt{" "}
                    <strong>{Math.abs(monthDiff)} month{Math.abs(monthDiff) !== 1 ? "s" : ""}{" "}
                    {monthDiff > 0 ? "later" : "sooner"}</strong></>}.
                </>
              ) : (
                <>The <strong>{altResult.strategy.toUpperCase()}</strong> strategy would save you{" "}
                  <strong>LKR {fmt(Math.abs(interestSaving))}</strong> more in interest.</>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">WHY {selected.toUpperCase()}?</div>
          <p style={{ lineHeight: "1.7" }}>{activeResult.explanation}</p>
          <div style={{ marginTop: "16px", borderTop: "1px solid #ccc", paddingTop: "16px" }}>
            <strong>HOW IT WORKS:</strong>
            <ol className="text-muted" style={{ paddingLeft: "1.2rem", marginTop: "8px", lineHeight: "1.8" }}>
              {selected === "avalanche" ? (
                <>
                  <li>Pay the required minimum on every loan each month.</li>
                  <li>Direct all remaining budget to the loan with the highest annual interest rate.</li>
                  <li>When that loan reaches zero, roll its payment into the next highest-rate loan.</li>
                  <li>Repeat until all debts are cleared.</li>
                </>
              ) : (
                <>
                  <li>Pay the required minimum on every loan each month.</li>
                  <li>Direct all remaining budget to the loan with the smallest outstanding balance.</li>
                  <li>When that loan reaches zero, roll its payment into the next smallest loan.</li>
                  <li>Repeat until all debts are cleared.</li>
                </>
              )}
            </ol>
          </div>
        </div>

        <div className="card">
          <div className="card-title">PROJECTED PAYMENT SCHEDULE — {selected.toUpperCase()}</div>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Showing {showFullSchedule ? "all" : "first 12"} of {activeResult.schedule.length} months.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="right">Remaining Debt (LKR)</th>
                  <th className="right">Interest This Month (LKR)</th>
                  <th className="right">Principal Paid (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {scheduleToShow.map((row, i) => (
                  <tr key={i}>
                    <td>{row.label}</td>
                    <td className="right">
                      {row.totalDebt === 0
                        ? <span style={{ color: "green", fontWeight: "bold" }}>PAID OFF</span>
                        : fmt(row.totalDebt)}
                    </td>
                    <td className="right" style={{ color: "#c00" }}>{fmt(row.interestPaid)}</td>
                    <td className="right">{fmt(row.principalPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeResult.schedule.length > 12 && (
            <button onClick={() => setShowFull(!showFullSchedule)}
              style={{ marginTop: "12px", fontSize: "0.9rem", padding: "0.6rem" }}>
              {showFullSchedule ? "SHOW LESS" : `SHOW ALL ${activeResult.schedule.length} MONTHS`}
            </button>
          )}
        </div>

        <div className="page-actions">
          <button onClick={() => navigate("/input")}>← UPDATE DATA</button>
          <button className="btn-primary" onClick={() => navigate("/progress")}>VIEW PROGRESS →</button>
        </div>

      </div>
    </PageLayout>
  );
}