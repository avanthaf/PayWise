import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend,
} from "recharts";
import PageLayout from "../components/PageLayout";

interface MonthSnapshot { month: number; label: string; totalDebt: number; interestPaid: number; principalPaid: number; loans: { label: string; balance: number }[]; }
interface StrategyResult { strategy: "avalanche" | "snowball"; monthlyPayment: number; totalInterestPaid: number; totalPaid: number; monthsToPayoff: number; payoffDate: string; explanation: string; schedule: MonthSnapshot[]; }
interface StrategyResponse { recommended: "avalanche" | "snowball"; monthlyBudget: number; totalDebt: number; income: number; totalExpenses: number; availableMonthly: number; avalanche: StrategyResult; snowball: StrategyResult; }
type ViewMode = "avalanche" | "snowball";

const fmt = (n: number) => n.toLocaleString();

function thinSchedule(schedule: MonthSnapshot[], maxPoints = 36): MonthSnapshot[] {
  if (schedule.length <= maxPoints) return schedule;
  const step = Math.ceil(schedule.length / maxPoints);
  const thinned = schedule.filter((_, i) => i % step === 0);
  const last = schedule[schedule.length - 1];
  if (thinned[thinned.length - 1].month !== last.month) thinned.push(last);
  return thinned;
}

function milestoneMonth(schedule: MonthSnapshot[], pct: number, totalDebt: number) {
  const target = totalDebt * (1 - pct);
  const found = schedule.find((s) => s.totalDebt <= target);
  return found ? found.label : null;
}

function StatBox({ label, value, sub, highlight, accent }: {
  label: string; value: string; sub?: string; highlight?: boolean; accent?: boolean;
}) {
  return (
    <div style={{
      border: highlight ? "2px solid #000" : "1px solid #ccc",
      padding: "14px 16px",
      background: accent ? "#000" : highlight ? "#fafafa" : "#fff",
      color: accent ? "#fff" : "#000",
    }}>
      <div className="text-muted" style={{ color: accent ? "rgba(255,255,255,0.7)" : undefined, marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: "bold" }}>{value}</div>
      {sub && <div className="text-hint" style={{ marginTop: "4px", color: accent ? "rgba(255,255,255,0.6)" : undefined }}>{sub}</div>}
    </div>
  );
}

interface TooltipPayloadItem { name: string; value: number; color?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ border: "2px solid #000", background: "#fff", padding: "10px 14px", fontFamily: "monospace", fontSize: "0.8rem" }}>
      <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#000" }}>{p.name}: LKR {fmt(Math.round(p.value))}</div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const [data, setData]     = useState<StrategyResponse | null>(null);
  const [view, setView]     = useState<ViewMode>("avalanche");
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/finance/strategy/${userName}`);
      if (res.status === 404) { setError("No financial data found. Please enter your data first."); return; }
      if (!res.ok) throw new Error();
      const body: StrategyResponse = await res.json();
      setData(body); setView(body.recommended);
    } catch { setError("Failed to load progress data. Make sure the server is running."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!userName) { navigate("/login"); return; }
    fetchData();
  }, [navigate, userName]);

  if (loading) return (
    <PageLayout><div className="page-content" style={{ alignItems: "center" }}>
      <div className="app-title">LOADING PROGRESS…</div>
    </div></PageLayout>
  );

  if (error || !data) return (
    <PageLayout><div className="page-content">
      <div className="app-title">PROGRESS</div>
      <div className="card">
        <p style={{ color: "red" }}>⚠ {error}</p>
        <button onClick={() => navigate("/input")} style={{ marginTop: "12px" }}>GO TO DATA INPUT</button>
      </div>
    </div></PageLayout>
  );

  const result   = view === "avalanche" ? data.avalanche : data.snowball;
  const schedule = result.schedule;
  const totalDebt  = data.totalDebt;
  const chartData  = thinSchedule(schedule);
  const breakdownData = thinSchedule(schedule, 24).map((s) => ({ label: s.label, interest: s.interestPaid, principal: s.principalPaid }));

  const m25 = milestoneMonth(schedule, 0.25, totalDebt);
  const m50 = milestoneMonth(schedule, 0.50, totalDebt);
  const m75 = milestoneMonth(schedule, 0.75, totalDebt);

  const after3   = schedule[2];
  const paidSoFar = after3 ? totalDebt - after3.totalDebt : 0;
  const pctPaid   = totalDebt > 0 ? Math.round((paidSoFar / totalDebt) * 100) : 0;
  const firstMonthInterest = schedule[0]?.interestPaid ?? 0;
  const lastMonthInterest  = schedule[schedule.length - 2]?.interestPaid ?? 0;
  const interestReduction  = firstMonthInterest - lastMonthInterest;

  return (
    <PageLayout>
      <div className="page-content">


        <div className="app-title">PROGRESS TRACKING</div>
        <div className="card">
          <div style={{ display: "flex", gap: "12px" }}>
            {(["avalanche", "snowball"] as ViewMode[]).map((s) => (
              <button key={s} onClick={() => setView(s)} style={{
                flex: 1, padding: "10px", fontSize: "0.9rem",
                background: view === s ? "#000" : "#fff",
                color:      view === s ? "#fff" : "#000",
                border: "2px solid #000",
              }}>
                {s.toUpperCase()}
                {data.recommended === s && <span style={{ fontSize: "0.65rem", marginLeft: "6px", opacity: 0.7 }}>★ RECOMMENDED</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">OVERVIEW — {view.toUpperCase()}</div>
          <div className="grid-4">
            <StatBox label="Total Debt"      value={`LKR ${fmt(totalDebt)}`}                highlight />
            <StatBox label="Monthly Budget"  value={`LKR ${fmt(result.monthlyPayment)}`} />
            <StatBox label="Payoff Date"     value={result.payoffDate}  sub={`${result.monthsToPayoff} months`} highlight />
            <StatBox label="Total Interest"  value={`LKR ${fmt(result.totalInterestPaid)}`}
              sub={`${Math.round((result.totalInterestPaid / totalDebt) * 100)}% of principal`} accent />
          </div>
        </div>
        <div className="card">
          <div className="card-title">PROJECTED DEBT REDUCTION</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span className="text-hint">LKR 0</span>
              <span className="text-hint" style={{ fontWeight: "bold" }}>LKR {fmt(totalDebt)} (Start)</span>
            </div>
            <div style={{ width: "100%", height: "20px", background: "#eee", border: "1px solid #ccc" }}>
              <div style={{ width: `${Math.min(100, pctPaid)}%`, height: "100%", background: "#000", transition: "width 0.5s ease" }} />
            </div>
            <div className="text-hint" style={{ marginTop: "4px" }}>
              Projected reduction after 3 months: {pctPaid}% (LKR {fmt(Math.round(paidSoFar))})
            </div>
          </div>
          <div style={{ height: "340px", marginTop: "8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                <defs>
                  <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="label" stroke="#000" tick={{ fontFamily: "monospace", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#000" tick={{ fontFamily: "monospace", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: "Debt (LKR)", angle: -90, position: "insideLeft", offset: -4, style: { fontFamily: "monospace", fontSize: 11 } }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalDebt" name="Remaining Debt" stroke="#000" strokeWidth={2}
                  fill="url(#debtGrad)" dot={false} activeDot={{ r: 5, fill: "#000" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-title">INTEREST vs PRINCIPAL PAID PER MONTH</div>
          <p className="text-muted" style={{ marginTop: 0 }}>
            As debt decreases, the interest portion shrinks — meaning more of your payment goes toward the actual balance each month.
          </p>
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="label" tick={{ fontFamily: "monospace", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontFamily: "monospace", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: "0.8rem" }} />
                <Bar dataKey="principal" name="Principal" fill="#000" stackId="a" />
                <Bar dataKey="interest"  name="Interest"  fill="#aaa" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid-2" style={{ marginTop: "16px" }}>
            <StatBox label="Interest — Month 1"    value={`LKR ${fmt(firstMonthInterest)}`} sub="Highest point" />
            <StatBox label="Interest — Final Month" value={`LKR ${fmt(lastMonthInterest)}`}  sub={`Down LKR ${fmt(interestReduction)}`} highlight />
          </div>
        </div>
        <div className="card">
          <div className="card-title">MILESTONE TRACKER</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "25% Debt Cleared",  date: m25,                pct: 25  },
              { label: "50% Debt Cleared",  date: m50,                pct: 50  },
              { label: "75% Debt Cleared",  date: m75,                pct: 75  },
              { label: "100% Debt-Free 🎉", date: result.payoffDate,  pct: 100 },
            ].map(({ label, date, pct }) => (
              <div key={pct} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", border: "1px solid #ddd", background: "#fafafa" }}>
                <div style={{
                  width: "36px", height: "36px", border: "2px solid #000",
                  background: date ? "#000" : "#fff", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: date ? "#fff" : "#000", fontSize: "0.7rem", fontWeight: "bold",
                }}>
                  {pct}%
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{label}</div>
                  <div className="text-hint" style={{ marginTop: "2px" }}>
                    {date ? `Projected: ${date}` : "Calculating…"}
                  </div>
                </div>
                <div style={{ width: "120px", height: "8px", background: "#eee", border: "1px solid #ccc", flexShrink: 0 }}>
                  <div style={{ width: date ? "100%" : "0%", height: "100%", background: "#000" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">STRATEGY COMPARISON</div>
          <div className="grid-2">
            {(["avalanche", "snowball"] as const).map((s) => {
              const r = s === "avalanche" ? data.avalanche : data.snowball;
              const isActive = view === s;
              return (
                <div key={s} style={{ border: isActive ? "2px solid #000" : "1px solid #ccc", padding: "14px", background: isActive ? "#fafafa" : "#fff" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {s.toUpperCase()}
                    {data.recommended === s && <span className="badge" style={{ position: "static" }}>RECOMMENDED</span>}
                  </div>
                  <div className="text-muted" style={{ lineHeight: "1.8" }}>
                    <div>Payoff: <strong>{r.payoffDate}</strong></div>
                    <div>Months: <strong>{r.monthsToPayoff}</strong></div>
                    <div>Total Interest: <strong>LKR {fmt(r.totalInterestPaid)}</strong></div>
                    <div>Total Paid: <strong>LKR {fmt(r.totalPaid)}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="info-banner">
            Interest difference: <strong>LKR {fmt(Math.abs(data.avalanche.totalInterestPaid - data.snowball.totalInterestPaid))}</strong>{" "}
            ({data.avalanche.totalInterestPaid <= data.snowball.totalInterestPaid ? "Avalanche" : "Snowball"} saves more)
            &nbsp;·&nbsp; Time difference: <strong>{Math.abs(data.avalanche.monthsToPayoff - data.snowball.monthsToPayoff)} month(s)</strong>
          </div>
        </div>

        <div className="page-actions">
          <button onClick={() => navigate("/strategy")}>← BACK TO STRATEGY</button>
          <button className="btn-primary" onClick={() => navigate("/input")}>UPDATE DATA →</button>
        </div>

      </div>
    </PageLayout>
  );
}