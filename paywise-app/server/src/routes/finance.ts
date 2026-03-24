import { Router, Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";
import { compareStrategies, LoanInput } from "../utils/repayment";

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

interface IExpense {
  label: string;
  amount: number;
}

interface ILoan {
  label: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

interface IGoals {
  preferredStrategy: "avalanche" | "snowball" | "dqn_rl" | "auto";
  targetMonths?: number;
  extraMonthly?: number;
}

interface IFinance extends Document {
  userName: string;
  income: number;
  expenses: IExpense[];
  loans: ILoan[];
  goals: IGoals;
  totalExpenses: number;
  totalLoans: number;
  totalDebt: number;
  availableMonthly: number;
  savedAt: Date;
}

export interface DQNMonthSnapshot {
  month: number;
  label: string;
  totalDebt: number;
  interestPaid: number;
  principalPaid: number;
  action: number;
  actionLabel: string;
}

export interface DQNResult {
  strategy: "dqn_rl";
  monthlyPayment: number;
  totalInterestPaid: number;
  totalPaid: number;
  monthsToPayoff: number;
  payoffDate: string;
  dominantAction: number;
  dominantActionLabel: string;
  explanation: string;
  schedule: DQNMonthSnapshot[];
}

const financeSchema = new Schema<IFinance>({
  userName: { type: String, required: true, unique: true },
  income:   { type: Number, default: 0 },
  expenses: [{ label: String, amount: Number }],
  loans: [{
    label:          String,
    balance:        { type: Number, default: 0 },
    interestRate:   { type: Number, default: 0 },
    minimumPayment: { type: Number, default: 0 },
  }],
  goals: {
    preferredStrategy: {
      type:    String,
      enum:    ["avalanche", "snowball", "dqn_rl", "auto"],
      default: "auto",
    },
    targetMonths:  { type: Number },
    extraMonthly:  { type: Number, default: 0 },
  },
  totalExpenses:    { type: Number, default: 0 },
  totalLoans:       { type: Number, default: 0 },
  totalDebt:        { type: Number, default: 0 },
  availableMonthly: { type: Number, default: 0 },
  savedAt:          { type: Date, default: Date.now },
});

const Finance = mongoose.model<IFinance>("Finance", financeSchema);

async function fetchDQNStrategy(
  income: number,
  totalExpenses: number,
  loans: ILoan[]
): Promise<DQNResult | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        income,
        totalExpenses,
        loans: loans.map((l) => ({
          balance:        l.balance,
          interestRate:   l.interestRate,
          minimumPayment: l.minimumPayment,
        })),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("ML service error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log("DQN result received:", data.strategy, data.monthsToPayoff);
    return data as DQNResult;

  } catch (err) {
    console.error("fetchDQNStrategy failed:", err);  // ← shows the real error
    return null;
  }
}

router.post("/save", async (req: Request, res: Response) => {
  const { userName, income, expenses, loans, goals } = req.body;

  if (!userName) {
    return res.status(400).json({ error: "userName is required" });
  }

  const totalExpenses: number = (expenses ?? []).reduce(
    (s: number, e: IExpense) => s + (e.amount || 0), 0
  );
  const totalLoans: number = (loans ?? []).reduce(
    (s: number, l: ILoan) => s + (l.minimumPayment || 0), 0
  );
  const totalDebt: number = (loans ?? []).reduce(
    (s: number, l: ILoan) => s + (l.balance || 0), 0
  );
  const availableMonthly = Math.max(
    (income || 0) - totalExpenses - totalLoans + (goals?.extraMonthly || 0), 0
  );

  try {
    const result = await Finance.findOneAndUpdate(
      { userName },
      {
        userName, income, expenses, loans,
        goals:            goals ?? { preferredStrategy: "auto", extraMonthly: 0 },
        totalExpenses,    totalLoans, totalDebt, availableMonthly,
        savedAt:          new Date(),
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Data saved successfully", data: result });
  } catch (err) {
    console.error("Error saving finance data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:userName", async (req: Request, res: Response) => {
  const { userName } = req.params;
  if (!userName) return res.status(400).json({ error: "userName is required" });

  try {
    const data = await Finance.findOne({ userName });
    if (!data) return res.status(404).json({ error: "No finance data found for this user" });
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error fetching finance data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/strategy/:userName", async (req: Request, res: Response) => {
  const { userName } = req.params;

  try {
    const record = await Finance.findOne({ userName });
    if (!record)            return res.status(404).json({ error: "No finance data found" });
    if (!record.loans?.length) return res.status(400).json({ error: "No loans entered yet" });

    const loanInputs: LoanInput[] = record.loans.map((l) => ({
      label:          l.label,
      balance:        l.balance,
      interestRate:   l.interestRate,
      minimumPayment: l.minimumPayment,
    }));

    const totalMinimums  = loanInputs.reduce((s, l) => s + l.minimumPayment, 0);
    const incomeSurplus  = Math.max(record.income - record.totalExpenses - totalMinimums, 0);
    const monthlyBudget  = totalMinimums + incomeSurplus + (record.goals?.extraMonthly || 0);

    if (monthlyBudget <= 0) {
      return res.status(400).json({ error: "Monthly budget is too low to cover minimum payments" });
    }

    const comparison = compareStrategies(loanInputs, monthlyBudget);

    const dqnResult = await fetchDQNStrategy(
      record.income,
      record.totalExpenses,
      record.loans
    );

    const preferredStrategy = record.goals?.preferredStrategy ?? "auto";

    let recommended: "avalanche" | "snowball" | "dqn_rl";
    if (preferredStrategy === "dqn_rl" && dqnResult) {
      recommended = "dqn_rl";
    } else if (preferredStrategy === "avalanche") {
      recommended = "avalanche";
    } else if (preferredStrategy === "snowball") {
      recommended = "snowball";
    } else {
      const ruleWinner =
        comparison.avalanche.totalInterestPaid <= comparison.snowball.totalInterestPaid
          ? "avalanche"
          : "snowball";

      if (
        dqnResult &&
        dqnResult.totalInterestPaid <
          Math.min(comparison.avalanche.totalInterestPaid, comparison.snowball.totalInterestPaid)
      ) {
        recommended = "dqn_rl";
      } else {
        recommended = ruleWinner;
      }
    }

    res.status(200).json({
      recommended,
      monthlyBudget,
      totalDebt:        record.totalDebt,
      income:           record.income,
      totalExpenses:    record.totalExpenses,
      availableMonthly: record.availableMonthly,
      avalanche:        comparison.avalanche,
      snowball:         comparison.snowball,
      dqn_rl:           dqnResult ?? null,
      mlServiceAvailable: dqnResult !== null,
    });
  } catch (err) {
    console.error("Error generating strategy:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;