/**
 * WIREFRAME - Progress Tracking Screen
 * Conceptual mockup for academic purposes
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockProgressData = [
  { month: "Jan", debt: 25000 },
  { month: "Feb", debt: 23600 },
  { month: "Mar", debt: 22150 },
  { month: "Apr", debt: 20650 },
  { month: "May", debt: 19100 },
  { month: "Jun", debt: 17500 },
  { month: "Jul", debt: 15850 },
  { month: "Aug", debt: 14150 },
  { month: "Sep", debt: 12400 },
  { month: "Oct", debt: 10600 },
  { month: "Nov", debt: 8750 },
  { month: "Dec", debt: 6850 },
];

export function WireframeProgress({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 bg-gray-50">
        <div className="text-2xl font-mono">
          PROGRESS TRACKING
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-sm font-mono">STATUS:</div>
          <div className="text-xl font-mono mt-1">
            IMPROVING
          </div>
        </div>
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-sm font-mono">REDUCTION:</div>
          <div className="text-xl font-mono mt-1">-28%</div>
        </div>
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-sm font-mono">ON TRACK:</div>
          <div className="text-xl font-mono mt-1">YES</div>
        </div>
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-sm font-mono">MONTHS LEFT:</div>
          <div className="text-xl font-mono mt-1">12</div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="border-2 border-black p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-mono">
            DEBT REDUCTION OVER TIME
          </div>
        </div>

        {/* Chart */}
        <div
          className="border border-gray-400 p-4 bg-gray-50"
          style={{ height: "400px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockProgressData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#666"
              />
              <XAxis
                dataKey="month"
                stroke="#000"
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <YAxis
                stroke="#000"
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
                label={{
                  value: "Debt Amount ($)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontFamily: "monospace",
                    fontSize: "12px",
                  },
                }}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  border: "2px solid black",
                }}
              />
              <Line
                type="monotone"
                dataKey="debt"
                stroke="#000"
                strokeWidth={2}
                dot={{ fill: "#000", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-2 border-black p-4 bg-gray-50">
          <div className="text-sm font-mono border-b border-gray-400 pb-2 mb-3">
            MILESTONE TRACKER:
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>25% Debt Paid - Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-black"></div>
              <span>50% Debt Paid - In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-white"></div>
              <span>75% Debt Paid - Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-white"></div>
              <span>100% Debt-Free - Target</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black p-4 bg-white">
          <div className="text-sm font-mono border-b border-gray-400 pb-2 mb-3">
            PAYMENT HISTORY:
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span>Jan 2026</span>
              <span className="font-mono">LKR 1,400.00</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span>Feb 2026</span>
              <span className="font-mono">LKR 1,450.00</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span>Mar 2026</span>
              <span className="font-mono">LKR 1,500.00</span>
            </div>
            <div className="text-gray-500 text-center pt-2">
              [Historical payment records]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}