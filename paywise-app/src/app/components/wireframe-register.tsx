/**
 * WIREFRAME - Registration / Sign Up Screen
 * Conceptual mockup for academic purposes
 */

import { useState } from "react";

export function WireframeRegister({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="border-2 border-black p-4 text-center">
        <div className="text-2xl font-mono tracking-wider">
          DEBT MANAGEMENT SYSTEM
        </div>
        <div className="text-sm text-gray-600 mt-1">
          [APPLICATION HEADER]
        </div>
      </div>

      {/* Registration Form Container */}
      <div className="border-2 border-black p-8 bg-gray-50">
        <div className="text-center mb-6">
          <div className="text-xl font-mono border-b-2 border-black pb-2">
            USER REGISTRATION
          </div>
          <div className="text-xs text-gray-500 mt-2">
            [Conceptual Wireframe - For Future Implementation]
          </div>
        </div>

        <div className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">FULL NAME:</div>
              <div className="text-xs text-gray-500">[Required Field]</div>
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="[Enter your full name]"
                className="w-full font-mono text-sm outline-none"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">EMAIL ADDRESS:</div>
              <div className="text-xs text-gray-500">[Required Field]</div>
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="[email@example.com]"
                className="w-full font-mono text-sm outline-none"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">PHONE NUMBER:</div>
              <div className="text-xs text-gray-500">[Optional]</div>
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="[+94 XXX XXX XXX]"
                className="w-full font-mono text-sm outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">PASSWORD:</div>
              <div className="text-xs text-gray-500">[Required Field]</div>
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="[••••••••]"
                className="w-full font-mono text-sm outline-none"
              />
            </div>
            <div className="text-xs text-gray-500">
              Minimum 8 characters, include letters and numbers
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">CONFIRM PASSWORD:</div>
              <div className="text-xs text-gray-500">[Required Field]</div>
            </div>
            <div className="border-2 border-gray-400 p-3 bg-white">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="[••••••••]"
                className="w-full font-mono text-sm outline-none"
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="border-2 border-black p-4 bg-gray-100 mt-6">
            <div className="text-sm font-mono border-b border-gray-400 pb-2 mb-3">
              REGISTRATION PREVIEW:
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-mono">
                  {fullName || "[Not entered]"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono">{email || "[Not entered]"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-mono">
                  {phoneNumber || "[Not entered]"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Password:</span>
                <span className="font-mono">
                  {password ? "[••••••••]" : "[Not entered]"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Password Match:</span>
                <span className="font-mono">
                  {password && confirmPassword
                    ? password === confirmPassword
                      ? "[✓ Matched]"
                      : "[✗ Not Matched]"
                    : "[Not entered]"}
                </span>
              </div>
            </div>
          </div>

          {/* Register Button */}
          <div className="pt-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="w-full border-2 border-black bg-black text-white p-4 hover:bg-gray-800 transition-colors"
            >
              <div className="font-mono text-lg">[ CREATE ACCOUNT ]</div>
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={() => onNavigate("login")}
              className="text-sm text-gray-600 hover:text-black underline"
            >
              Already have an account? [ GO TO LOGIN ]
            </button>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="mt-6 border border-gray-400 p-3 bg-gray-100">
          <div className="text-xs text-gray-600 text-center">
            ⚠ PLACEHOLDER FOR FUTURE REGISTRATION LOGIC
            <br />
            (Form Validation, Password Hashing, User Database)
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="border border-gray-400 p-3 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="font-mono mb-1">IMPLEMENTATION NOTES:</div>
          • Email validation required
          <br />
          • Password strength checker to be implemented
          <br />
          • Duplicate email check needed
          <br />
          • Email verification system
          <br />• Terms & conditions acceptance
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-500 border-t-2 border-gray-300 pt-4">
        WIREFRAME ONLY - NOT FUNCTIONAL
      </div>
    </div>
  );
}
