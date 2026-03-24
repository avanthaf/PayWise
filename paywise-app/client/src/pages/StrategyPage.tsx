import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

interface MonthSnapshot {
  month: number; label: string; totalDebt: number;
  interestPaid: number; principalPaid: number;
}
interface DQNMonthSnapshot extends MonthSnapshot {
  action: number; actionLabel: string;
}
interface StrategyResult {
  strategy: "avalanche" | "snowball";
  monthlyPayment: number; totalInterestPaid: number; totalPaid: number;
  monthsToPayoff: number; payoffDate: string; explanation: string;
  schedule: MonthSnapshot[];
}
interface DQNResult {
  strategy: "dqn_rl";
  monthlyPayment: number; totalInterestPaid: number; totalPaid: number;
  monthsToPayoff: number; payoffDate: string; explanation: string;
  dominantAction: number; dominantActionLabel: string;
  schedule: DQNMonthSnapshot[];
}
interface StrategyResponse {
  recommended: "avalanche" | "snowball" | "dqn_rl";
  monthlyBudget: number; totalDebt: number; income: number;
  totalExpenses: number; availableMonthly: number;
  avalanche: StrategyResult; snowball: StrategyResult;
  dqn_rl: DQNResult | null;
  mlServiceAvailable: boolean;
}

type SelectedStrategy = "avalanche" | "snowball" | "dqn_rl";
const fmt = (n: number) => n.toLocaleString();

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ border: highlight ? "2px solid #000" : "1px solid #ccc", padding: "14px 16px", background: highlight ? "#f9f9f9" : "#fff" }}>
      <div className="text-muted">{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function StrategyCard({ result, isRecommended, isSelected, onSelect, badge, accentColor }: {
  result: StrategyResult | DQNResult; isRecommended: boolean; isSelected: boolean;
  onSelect: () => void; badge?: string; accentColor?: string;
}) {
  const isDQN = result.strategy === "dqn_rl";
  const title = isDQN ? "DQN AGENT" : result.strategy === "avalanche" ? "AVALANCHE" : "SNOWBALL";
  const subtitle = isDQN
    ? "Deep Q-Network reinforcement learning policy"
    : result.strategy === "avalanche"
      ? "Highest interest rate first"
      : "Smallest balance first";

  return (
    <div
      onClick={onSelect}
      className={`strategy-card${isSelected ? " strategy-card--selected" : ""}`}
      style={{ borderColor: isSelected ? (accentColor || "#000") : "#ccc" }}
    >
      {isRecommended && <div className="badge">RECOMMENDED</div>}
      {isDQN && (
        <div style={{
          position: "absolute", top: "-1px", left: "10px",
          background: "#1a1a2e", color: "#fff",
          fontSize: "0.62rem", padding: "2px 8px",
          fontFamily: "monospace", letterSpacing: "0.05rem",
        }}>
          DQN
        </div>
      )}
      <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px", marginTop: isDQN ? "8px" : "0" }}>
        {title}
      </div>
      <div className="text-muted" style={{ marginBottom: "16px" }}>{subtitle}</div>
      <div className="grid-2">
        <StatBox label="Payoff Date"         value={result.payoffDate} />
        <StatBox label="Months to Payoff"    value={`${result.monthsToPayoff} mo`} />
        <StatBox label="Total Interest Paid" value={`LKR ${fmt(result.totalInterestPaid)}`} />
        <StatBox label="Total Amount Paid"   value={`LKR ${fmt(result.totalPaid)}`} />
      </div>
      {isDQN && (result as DQNResult).dominantActionLabel && (
        <div style={{
          marginTop: "12px", padding: "8px 12px", background: "#f0f4ff",
          border: "1px solid #c8d4f0", fontSize: "0.8rem",
        }}>
          <span className="text-muted">Agent's dominant action: </span>
          <strong>{(result as DQNResult).dominantActionLabel}</strong>
        </div>
      )}
    </div>
  );
}

export default function StrategyPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [data,     setData]     = useState<StrategyResponse | null>(null);
  const [selected, setSelected] = useState<SelectedStrategy>("avalanche");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showFull, setShowFull] = useState(false);

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
      setData(body);
      setSelected(body.recommended);
    } catch { setError("Failed to load strategy. Make sure the server is running."); }
    finally  { setLoading(false); }
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

  const activeResult: StrategyResult | DQNResult =
    selected === "dqn_rl" ? data.dqn_rl! : data[selected];

  const schedule      = activeResult.schedule;
  const scheduleToShow = showFull ? schedule : schedule.slice(0, 12);

  const bestRuleBased =
    data.avalanche.totalInterestPaid <= data.snowball.totalInterestPaid
      ? data.avalanche : data.snowball;

  const dqnVsRule = data.dqn_rl
    ? bestRuleBased.totalInterestPaid - data.dqn_rl.totalInterestPaid
    : null;

  return (
    <PageLayout>
      <div className="page-content">
        <div className="app-title">REPAYMENT STRATEGY</div>

        {/* Financial snapshot */}
        <div className="card">
          <div className="card-title">YOUR FINANCIAL SNAPSHOT</div>
          <div className="grid-3">
            <StatBox label="Monthly Income"           value={`LKR ${fmt(data.income)}`} />
            <StatBox label="Monthly Expenses"         value={`LKR ${fmt(data.totalExpenses)}`} />
            <StatBox label="Total Debt"               value={`LKR ${fmt(data.totalDebt)}`}          highlight />
            <StatBox label="Monthly Budget for Debt"  value={`LKR ${fmt(data.monthlyBudget)}`}      highlight />
            <StatBox label="Available After Minimums" value={`LKR ${fmt(data.availableMonthly)}`} />
            <StatBox label="Recommended Strategy"     value={data.recommended === "dqn_rl" ? "DQN AGENT" : data.recommended.toUpperCase()} highlight />
          </div>
        </div>

        {!data.mlServiceAvailable && (
          <div className="warn-banner">
            DQN service is offline. Only rule-based strategies are available.
            Start <code>ml_service.py</code> to enable the DQN Agent tab.
          </div>
        )}

        {data.dqn_rl && dqnVsRule !== null && (
          <div style={{
            padding: "14px 20px", border: "2px solid #1a1a2e",
            background: "#f0f4ff", fontSize: "0.88rem", lineHeight: 1.7,
          }}>
            🤖 <strong>The DQN Agent:</strong>
            {dqnVsRule > 0
              ? <>saves <strong>LKR {fmt(Math.round(dqnVsRule))}</strong> more in interest than the best rule-based strategy and finishes{" "}
                  <strong>{Math.abs(bestRuleBased.monthsToPayoff - data.dqn_rl.monthsToPayoff)} month(s)</strong> earlier.</>
              : <>pays <strong>LKR {fmt(Math.abs(Math.round(dqnVsRule)))}</strong> more in interest than the best rule-based strategy
                  {" "}but applies a stress-aware payment approach that avoids over-commitment.</>
            }
          </div>
        )}

        <div className="card">
          <div className="card-title">CHOOSE YOUR STRATEGY</div>
          <p className="text-muted" style={{ marginTop: 0 }}>Click a strategy to see its full breakdown.</p>

          <div className="grid-2" style={{ marginBottom: "12px" }}>
            <StrategyCard
              result={data.avalanche} isRecommended={data.recommended === "avalanche"}
              isSelected={selected === "avalanche"} onSelect={() => setSelected("avalanche")}
            />
            <StrategyCard
              result={data.snowball}  isRecommended={data.recommended === "snowball"}
              isSelected={selected === "snowball"}  onSelect={() => setSelected("snowball")}
            />
          </div>

          {data.dqn_rl ? (
            <StrategyCard
              result={data.dqn_rl}  isRecommended={data.recommended === "dqn_rl"}
              isSelected={selected === "dqn_rl"}    onSelect={() => setSelected("dqn_rl")}
              accentColor="#1a1a2e"
            />
          ) : (
            <div style={{
              border: "2px dashed #ccc", padding: "20px", textAlign: "center",
              color: "#aaa", fontSize: "0.88rem",
            }}>
              DQN AGENT — unavailable (start ml_service.py to enable)
            </div>
          )}

          {selected !== "dqn_rl" && (() => {
            const altResult = selected === "avalanche" ? data.snowball : data.avalanche;
            const saving    = altResult.totalInterestPaid - activeResult.totalInterestPaid;
            const monthDiff = altResult.monthsToPayoff - activeResult.monthsToPayoff;
            if (saving === 0) return null;
            return (
              <div className="info-banner" style={{ marginTop: "12px" }}>
                {saving > 0
                  ? <>The <strong>{selected.toUpperCase()}</strong> strategy saves you{" "}
                      <strong>LKR {fmt(saving)}</strong> in interest
                      {monthDiff !== 0 && <> and pays off debt{" "}
                        <strong>{Math.abs(monthDiff)} month{Math.abs(monthDiff) !== 1 ? "s" : ""}{" "}
                        {monthDiff > 0 ? "later" : "sooner"}</strong></>}.</>
                  : <>The <strong>{(altResult as StrategyResult).strategy.toUpperCase()}</strong> saves{" "}
                      <strong>LKR {fmt(Math.abs(saving))}</strong> more in interest.</>
                }
              </div>
            );
          })()}
        </div>

        <div className="card">
          <div className="card-title">
            WHY{" "}
            {selected === "dqn_rl" ? "DQN AGENT" : selected.toUpperCase()}?
          </div>
          <p style={{ lineHeight: "1.7" }}>{activeResult.explanation}</p>

          {selected !== "dqn_rl" && (
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
          )}

          {selected === "dqn_rl" && data.dqn_rl && (
            <div style={{ marginTop: "16px", borderTop: "1px solid #ccc", paddingTop: "16px" }}>
              <strong>HOW THE DQN AGENT WORKS:</strong>
              <ol className="text-muted" style={{ paddingLeft: "1.2rem", marginTop: "8px", lineHeight: "1.8" }}>
                <li>The agent was trained using Deep Q-Learning across thousands of simulated repayment episodes.</li>
                <li>Each month it observes your income, expenses, loan payment, and debt-to-income ratio.</li>
                <li>It selects from 5 payment levels (minimum → full disposable income) to maximise long-term reward.</li>
                <li>The reward function penalises interest cost and financial stress while rewarding debt reduction.</li>
                <li>This month the agent's dominant action is: <strong>{data.dqn_rl.dominantActionLabel}</strong>.</li>
              </ol>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            PROJECTED PAYMENT SCHEDULE —{" "}
            {selected === "dqn_rl" ? "DQN AGENT" : selected.toUpperCase()}
          </div>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Showing {showFull ? "all" : "first 12"} of {schedule.length} months.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="right">Remaining Debt (LKR)</th>
                  <th className="right">Interest (LKR)</th>
                  <th className="right">Principal Paid (LKR)</th>
                  {selected === "dqn_rl" && <th>Agent Action</th>}
                </tr>
              </thead>
              <tbody>
                {(scheduleToShow as (MonthSnapshot & Partial<DQNMonthSnapshot>)[]).map((row, i) => (
                  <tr key={i}>
                    <td>{row.label}</td>
                    <td className="right">
                      {row.totalDebt === 0
                        ? <span style={{ color: "green", fontWeight: "bold" }}>PAID OFF</span>
                        : fmt(row.totalDebt)}
                    </td>
                    <td className="right" style={{ color: "#c00" }}>{fmt(row.interestPaid)}</td>
                    <td className="right">{fmt(row.principalPaid)}</td>
                    {selected === "dqn_rl" && (
                      <td style={{ fontSize: "0.78rem", color: "#555" }}>
                        {row.actionLabel ?? "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {schedule.length > 12 && (
            <button onClick={() => setShowFull(!showFull)}
              style={{ marginTop: "12px", fontSize: "0.9rem", padding: "0.6rem" }}>
              {showFull ? "SHOW LESS" : `SHOW ALL ${schedule.length} MONTHS`}
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