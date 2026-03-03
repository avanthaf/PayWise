import { Router, Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";

const router = Router();

// Types
interface IExpense {
  label: string;
  amount: number;
}

interface ILoan {
  label: string;
  amount: number;
}

interface IFinance extends Document {
  userName: string;
  income: number;
  expenses: IExpense[];
  loans: ILoan[];
  totalExpenses: number;
  totalLoans: number;
  balance: number;
  savedAt: Date;
}

// Schema
const financeSchema = new Schema<IFinance>({
  userName: { type: String, required: true },
  income: { type: Number, default: 0 },
  expenses: [{ label: String, amount: Number }],
  loans: [{ label: String, amount: Number }],
  totalExpenses: { type: Number, default: 0 },
  totalLoans: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  savedAt: { type: Date, default: Date.now },
});

const Finance = mongoose.model<IFinance>("Finance", financeSchema);

// POST /api/finance/save
router.post("/save", async (req: Request, res: Response) => {
  const { userName, income, expenses, loans, totalExpenses, totalLoans, balance } = req.body;

  if (!userName) {
    return res.status(400).json({ error: "userName is required" });
  }

  try {
    const result = await Finance.findOneAndUpdate(
      { userName },
      {
        userName,
        income,
        expenses,
        loans,
        totalExpenses,
        totalLoans,
        balance,
        savedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Data saved successfully", data: result });
  } catch (err) {
    console.error("Error saving finance data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;