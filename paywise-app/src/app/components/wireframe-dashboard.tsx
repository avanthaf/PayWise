/**
 * WIREFRAME - Debt Overview Dashboard
 * Conceptual mockup for academic purposes
 */

export function WireframeDashboard({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono">
              DEBT OVERVIEW DASHBOARD
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            [John Doe]
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Income Card */}
        <div className="border-2 border-black p-6 bg-white">
          <div className="text-xs text-gray-500 font-mono mb-2">
            [CARD 1]
          </div>
          <div className="text-sm font-mono border-b border-gray-300 pb-2 mb-3">
            MONTHLY INCOME
          </div>
          <div className="text-3xl font-mono">LKR 5,000</div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="border-2 border-black p-6 bg-white">
          <div className="text-xs text-gray-500 font-mono mb-2">
            [CARD 2]
          </div>
          <div className="text-sm font-mono border-b border-gray-300 pb-2 mb-3">
            MONTHLY EXPENSES
          </div>
          <div className="text-3xl font-mono">LKR 3,500</div>
        </div>

        {/* Debt-to-Income Ratio Card */}
        <div className="border-2 border-black p-6 bg-gray-50">
          <div className="text-xs text-gray-500 font-mono mb-2">
            [CARD 3]
          </div>
          <div className="text-sm font-mono border-b border-gray-300 pb-2 mb-3">
            DEBT-TO-INCOME RATIO
          </div>
          <div className="text-3xl font-mono">28%</div>
        </div>
      </div>

      {/* Financial Entries Table */}
      <div className="border-2 border-black p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-mono">
            FINANCIAL ENTRIES
          </div>
          <button
            onClick={() => onNavigate("input")}
            className="border border-black px-4 py-2 text-sm font-mono hover:bg-gray-100"
          >
            ADD ENTRY
          </button>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-2 border-black bg-gray-50">
              <th className="border border-gray-400 p-3 text-left text-sm font-mono">
                CATEGORY
              </th>
              <th className="border border-gray-400 p-3 text-left text-sm font-mono">
                AMOUNT
              </th>
              <th className="border border-gray-400 p-3 text-left text-sm font-mono">
                TYPE
              </th>
              <th className="border border-gray-400 p-3 text-left text-sm font-mono">
                DATE
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-gray-300">
              <td className="border border-gray-300 p-3 font-mono text-sm">
                Salary
              </td>
              <td className="border border-gray-300 p-3 font-mono text-sm">
                $5,000.00
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                Income
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                2026-02-01
              </td>
            </tr>
            <tr className="border border-gray-300 bg-gray-50">
              <td className="border border-gray-300 p-3 font-mono text-sm">
                Housing
              </td>
              <td className="border border-gray-300 p-3 font-mono text-sm">
                $1,500.00
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                Expense
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                2026-02-01
              </td>
            </tr>
            <tr className="border border-gray-300">
              <td className="border border-gray-300 p-3 font-mono text-sm">
                Utilities
              </td>
              <td className="border border-gray-300 p-3 font-mono text-sm">
                $200.00
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                Expense
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                2026-02-01
              </td>
            </tr>
            <tr className="border border-gray-300 bg-gray-50">
              <td className="border border-gray-300 p-3 font-mono text-sm">
                Student Loan
              </td>
              <td className="border border-gray-300 p-3 font-mono text-sm">
                $500.00
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                Loan Payment
              </td>
              <td className="border border-gray-300 p-3 text-sm">
                2026-02-01
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}