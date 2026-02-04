/**
 * WIREFRAME - Login / Authentication Screen
 * Conceptual mockup for academic purposes
 */

export function WireframeLogin({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 text-center">
        <div className="text-2xl font-mono tracking-wider">
          PayWise
        </div>
      </div>

      {/* Login Form Container */}
      <div className="border-2 border-black p-8 bg-gray-50">
        <div className="text-center mb-6">
          <div className="text-xl font-mono border-b-2 border-black pb-2">
            LOGIN
          </div>
        </div>

        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <div className="text-sm font-mono">
              EMAIL ADDRESS:
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <div className="text-gray-400 text-sm">
                [email@example.com]
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="text-sm font-mono">PASSWORD:</div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <div className="text-gray-400 text-sm">
                [••••••••]
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="pt-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="w-full border-2 border-black bg-white p-4 hover:bg-gray-200 transition-colors"
            >
              <div className="font-mono text-lg">LOGIN</div>
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate("register")}
              className="text-sm text-gray-600 hover:text-black underline"
            >
              Don't have an account? [ CREATE ACCOUNT ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}