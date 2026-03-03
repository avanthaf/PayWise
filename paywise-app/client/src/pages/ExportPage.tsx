/**
 * WIREFRAME - Export / Report Screen
 * Conceptual mockup for academic purposes
 */

export function WireframeExport({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 bg-gray-50">
        <div className="text-2xl font-mono">
          EXPORT / REPORT GENERATION
        </div>
      </div>

      {/* Export Options */}
      <div className="border-2 border-black p-6 bg-white space-y-4">
        <div className="text-lg font-mono border-b-2 border-black pb-2">
          EXPORT REPAYMENT PLAN
        </div>

        {/* File Format Selection */}
        <div className="border border-gray-400 p-4 bg-gray-50">
          <div className="text-sm font-mono mb-3">
            SELECT FILE FORMAT:
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-400 bg-white hover:bg-gray-50 cursor-pointer">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <div>
                <div className="font-mono text-sm">
                  PDF DOCUMENT
                </div>
                <div className="text-xs text-gray-600">
                  Formatted report with charts and analysis
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-400 bg-white hover:bg-gray-50 cursor-pointer">
              <div className="w-4 h-4 border-2 border-black bg-white"></div>
              <div>
                <div className="font-mono text-sm">
                  CSV SPREADSHEET
                </div>
                <div className="text-xs text-gray-600">
                  Raw data for further analysis
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Report Contents */}
        <div className="border border-gray-400 p-4 bg-gray-50">
          <div className="text-sm font-mono mb-3">
            REPORT CONTENTS:
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>Financial Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>Debt-to-Income Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>Repayment Strategy Details</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>Progress Charts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>Payment Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-white"></div>
              <span>Transaction History (Optional)</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button className="w-full border-2 border-black bg-black text-white p-6 hover:bg-gray-800 transition-colors">
          <div className="font-mono text-xl">
            GENERATE & DOWNLOAD REPORT
          </div>
          <div className="text-xs mt-2">
            Click to export repayment plan
          </div>
        </button>
      </div>

      {/* Preview Section */}
      <div className="border-2 border-black p-6 bg-gray-50">
        <div className="text-sm font-mono border-b border-gray-400 pb-2 mb-4">
          REPORT PREVIEW:
        </div>

        <div className="border border-gray-400 p-6 bg-white space-y-3 text-sm">
          <div className="text-center font-mono border-b-2 border-black pb-3 mb-3">
            DEBT REPAYMENT PLAN REPORT
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-mono">
                Report Generated:
              </span>
              <span>February 3, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">User:</span>
              <span>John Doe</span>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="font-mono mb-2">SUMMARY:</div>
            <div className="text-xs text-gray-600 space-y-1">
              • Total Debt: LKR 25,000
              <br />
              • Monthly Payment: LKR 1,400
              <br />
              • Projected Payoff: February 2028
              <br />• Total Interest Saved: LKR 4,250
            </div>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate("dashboard")}
          className="border border-gray-400 p-3 hover:bg-gray-100 transition-colors"
        >
          <div className="text-sm font-mono">
            BACK TO DASHBOARD
          </div>
        </button>
        <button className="border border-gray-400 p-3 hover:bg-gray-100 transition-colors">
          <div className="text-sm font-mono">PRINT REPORT</div>
        </button>
        <button className="border border-gray-400 p-3 hover:bg-gray-100 transition-colors">
          <div className="text-sm font-mono">EMAIL REPORT</div>
        </button>
      </div>
    </div>
  );
}