import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InputPage() {
  const navigate = useNavigate();
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState<
    Array<{ label: string; amount: string }>
  >([]);
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [loanPayments, setLoanPayments] = useState<
    Array<{ label: string; amount: string }>
  >([]);
  const [newLoanLabel, setNewLoanLabel] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");

  const addExpense = () => {
    if (newExpenseLabel.trim() && newExpenseAmount.trim()) {
      setExpenses([
        ...expenses,
        { label: newExpenseLabel, amount: newExpenseAmount },
      ]);
      setNewExpenseLabel("");
      setNewExpenseAmount("");
    }
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const addLoan = () => {
    if (newLoanLabel.trim() && newLoanAmount.trim()) {
      setLoanPayments([
        ...loanPayments,
        { label: newLoanLabel, amount: newLoanAmount },
      ]);
      setNewLoanLabel("");
      setNewLoanAmount("");
    }
  };

  const removeLoan = (index: number) => {
    setLoanPayments(loanPayments.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 bg-gray-50">
        <div className="text-2xl font-mono">
          FINANCIAL DATA INPUT
        </div>
      </div>

      {/* Form Container */}
      <div className="border-2 border-black p-6 space-y-6 bg-white">
        <div className="text-xs text-gray-600 border-b border-gray-300 pb-2">
          Enter or update financial information
        </div>

        {/* Monthly Income */}
        <div className="border border-gray-400 p-4 bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                MONTHLY INCOME
              </div>
              <div className="text-xs text-gray-500">
                [Required Field]
              </div>
            </div>
            <div className="border-2 border-gray-600 bg-white">
              <input
                type="text"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="[Enter amount: e.g., 5000.00]"
                className="w-full p-3 font-mono text-sm outline-none"
              />
            </div>
            <div className="text-xs text-gray-500">LKR</div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="border border-gray-400 p-4 bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                MONTHLY EXPENSES
              </div>
              <div className="text-xs text-gray-500">
                [Required Field]
              </div>
            </div>

            {/* List of added expenses */}
            {expenses.length > 0 && (
              <div className="border-2 border-gray-600 bg-white p-2 space-y-1">
                {expenses.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border border-gray-300 bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">
                        {expense.label}
                      </div>
                      <div className="font-mono text-sm">
                        LKR {expense.amount}
                      </div>
                    </div>
                    <button
                      onClick={() => removeExpense(index)}
                      className="border border-black px-3 py-1 text-xs hover:bg-gray-200"
                    >
                      [ REMOVE ]
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new expense inputs */}
            <div className="space-y-2 pt-2">
              <div className="text-xs text-gray-600 font-mono">
                ADD NEW EXPENSE:
              </div>
              <div className="border-2 border-gray-600 bg-white">
                <input
                  type="text"
                  value={newExpenseLabel}
                  onChange={(e) =>
                    setNewExpenseLabel(e.target.value)
                  }
                  placeholder="[Label: e.g., Rent, Utilities, Food]"
                  className="w-full p-3 font-mono text-sm outline-none"
                />
              </div>
              <div className="border-2 border-gray-600 bg-white">
                <input
                  type="text"
                  value={newExpenseAmount}
                  onChange={(e) =>
                    setNewExpenseAmount(e.target.value)
                  }
                  placeholder="[Amount: e.g., 3000.00]"
                  className="w-full p-3 font-mono text-sm outline-none"
                />
              </div>
              <button
                onClick={addExpense}
                className="w-full border-2 border-black bg-white p-2 hover:bg-gray-200 transition-colors"
              >
                <div className="font-mono text-sm">
                  + ADD EXPENSE
                </div>
              </button>
            </div>

            <div className="text-xs text-gray-500">LKR</div>
          </div>
        </div>

        {/* Loan Payment Amount */}
        <div className="border border-gray-400 p-4 bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                LOAN PAYMENT AMOUNT
              </div>
              <div className="text-xs text-gray-500">
                [Required Field]
              </div>
            </div>

            {/* List of added loans */}
            {loanPayments.length > 0 && (
              <div className="border-2 border-gray-600 bg-white p-2 space-y-1">
                {loanPayments.map((loan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border border-gray-300 bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">
                        {loan.label}
                      </div>
                      <div className="font-mono text-sm">
                        LKR {loan.amount}
                      </div>
                    </div>
                    <button
                      onClick={() => removeLoan(index)}
                      className="border border-black px-3 py-1 text-xs hover:bg-gray-200"
                    >
                      [ REMOVE ]
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new loan inputs */}
            <div className="space-y-2 pt-2">
              <div className="text-xs text-gray-600 font-mono">
                ADD NEW LOAN:
              </div>
              <div className="border-2 border-gray-600 bg-white">
                <input
                  type="text"
                  value={newLoanLabel}
                  onChange={(e) =>
                    setNewLoanLabel(e.target.value)
                  }
                  placeholder="[Label: e.g., Personal Loan, Car Loan]"
                  className="w-full p-3 font-mono text-sm outline-none"
                />
              </div>
              <div className="border-2 border-gray-600 bg-white">
                <input
                  type="text"
                  value={newLoanAmount}
                  onChange={(e) =>
                    setNewLoanAmount(e.target.value)
                  }
                  placeholder="[Amount: e.g., 500.00]"
                  className="w-full p-3 font-mono text-sm outline-none"
                />
              </div>
              <button
                onClick={addLoan}
                className="w-full border-2 border-black bg-white p-2 hover:bg-gray-200 transition-colors"
              >
                <div className="font-mono text-sm">
                  + ADD LOAN
                </div>
              </button>
            </div>

            <div className="text-xs text-gray-500">
              LKR per month
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border-2 border-black p-6 bg-gray-100">
          <div className="text-lg font-mono border-b-2 border-black pb-2 mb-4">
            PREVIEW
          </div>
          <div className="text-xs text-gray-600 mb-4">
            Review your entries before saving
          </div>

          <div className="space-y-4">
            {/* Income Preview */}
            <div className="border border-gray-400 p-3 bg-white">
              <div className="text-xs text-gray-500 font-mono mb-1">
                MONTHLY INCOME:
              </div>
              <div className="text-sm font-mono">
                {income ? `LKR ${income}` : "[Not entered]"}
              </div>
            </div>

            {/* Expenses Preview */}
            <div className="border border-gray-400 p-3 bg-white">
              <div className="text-xs text-gray-500 font-mono mb-2">
                MONTHLY EXPENSES:
              </div>
              {expenses.length > 0 ? (
                <div className="space-y-1">
                  {expenses.map((expense, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm py-1 border-b border-gray-200"
                    >
                      <span>{expense.label}</span>
                      <span className="font-mono">
                        LKR {expense.amount}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 font-mono">
                    <span>TOTAL:</span>
                    <span>
                      LKR{" "}
                      {expenses
                        .reduce(
                          (sum, exp) =>
                            sum + (parseFloat(exp.amount) || 0),
                          0,
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  [No expenses added]
                </div>
              )}
            </div>

            {/* Loans Preview */}
            <div className="border border-gray-400 p-3 bg-white">
              <div className="text-xs text-gray-500 font-mono mb-2">
                LOAN PAYMENTS:
              </div>
              {loanPayments.length > 0 ? (
                <div className="space-y-1">
                  {loanPayments.map((loan, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm py-1 border-b border-gray-200"
                    >
                      <span>{loan.label}</span>
                      <span className="font-mono">
                        LKR {loan.amount}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 font-mono">
                    <span>TOTAL:</span>
                    <span>
                      LKR{" "}
                      {loanPayments
                        .reduce(
                          (sum, loan) =>
                            sum +
                            (parseFloat(loan.amount) || 0),
                          0,
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  [No loans added]
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 border-2 border-black bg-black text-white p-4 hover:bg-gray-800 transition-colors"
          >
            <div className="font-mono">SAVE</div>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 border-2 border-gray-400 bg-white p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="font-mono text-gray-600">
              CANCEL
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}