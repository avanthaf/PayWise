/**
 * WIREFRAME - Repayment Strategy Recommendation Screen
 * Conceptual mockup for academic purposes
 */

export function WireframeStrategy({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 bg-gray-50">
        <div className="text-2xl font-mono">
          REPAYMENT STRATEGY RECOMMENDATION
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="border-2 border-black p-6 bg-white">
        <div className="text-lg font-mono border-b-2 border-black pb-2 mb-4">
          RECOMMENDED STRATEGY
        </div>

        <div className="space-y-4">
          {/* Strategy Description */}
          <div className="border border-gray-400 p-6 bg-white">
            <div className="text-sm font-mono mb-3 border-b border-gray-300 pb-2">
              EXPLANATION:
            </div>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Based on your current financial profile (Monthly
                Income: LKR 5,000, Monthly Expenses: LKR 3,500,
                Available for Debt: LKR 1,500), the system
                recommends.
              </p>
              <p>
                <span className="font-mono">METHODOLOGY:</span>
                <br />
                1. Pay minimum payments on all debts
                <br />
                2. Apply extra payments to highest interest rate
                debt first
                <br />
                3. Once highest rate debt is paid, move to next
                highest
              </p>
              <p>
                <span className="font-mono">
                  PROJECTED OUTCOME:
                </span>
                <br />
                • Total Interest Saved: LKR 4,250
                <br />
                • Time to Debt-Free: 24 months
                <br />• Monthly Payment: LKR 1,400
              </p>
            </div>
          </div>

          {/* Alternative Strategy */}
          <div className="border border-gray-400 p-4 bg-gray-100">
            <div className="text-sm font-mono mb-2">
              ALTERNATIVE STRATEGY:
            </div>
            <div className="text-sm">
              Focus on smallest balance first
              <br />
              <span className="text-xs text-gray-600">
                (Time to Debt-Free: 26 months | Interest Saved:
                LKR 3,800)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("progress")}
          className="border-2 border-black bg-black text-white p-4 hover:bg-gray-800 transition-colors"
        >
          <div className="font-mono">SIMULATE STRATEGY</div>
          <div className="text-xs mt-1">
            View projected outcomes
          </div>
        </button>
        <button
          onClick={() => onNavigate("input")}
          className="border-2 border-black bg-white p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="font-mono">UPDATE PARAMETERS</div>
          <div className="text-xs mt-1 text-gray-600">
            Modify financial data
          </div>
        </button>
      </div>

      {/* Calculation Details */}
      <div className="border-2 border-black p-6 bg-gray-50">
        <div className="text-sm font-mono mb-3 border-b border-gray-400 pb-2">
          CALCULATION ASSUMPTIONS:
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border border-gray-400 p-3 bg-white">
            <div className="font-mono mb-1">
              Interest Rate (Avg):
            </div>
            <div>18.5% APR</div>
          </div>
          <div className="border border-gray-400 p-3 bg-white">
            <div className="font-mono mb-1">Total Debt:</div>
            <div>LKR 25,000</div>
          </div>
          <div className="border border-gray-400 p-3 bg-white">
            <div className="font-mono mb-1">
              Available Monthly:
            </div>
            <div>LKR 1,500</div>
          </div>
          <div className="border border-gray-400 p-3 bg-white">
            <div className="font-mono mb-1">Min. Payments:</div>
            <div>LKR 700</div>
          </div>
        </div>
      </div>
    </div>
  );
}