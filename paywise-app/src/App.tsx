import { useState } from "react";
import { WireframeLogin } from "./app/components/wireframe-login";
import { WireframeRegister } from "./app/components/wireframe-register";
import { WireframeInput } from "./app/components/wireframe-input";
import { WireframeDashboard } from "./app/components/wireframe-dashboard";
import { WireframeStrategy } from "./app/components/wireframe-strategy";
import { WireframeProgress } from "./app/components/wireframe-progress";
import { WireframeExport } from "./app/components/wireframe-export";

type Screen =
  | "login"
  | "register"
  | "input"
  | "dashboard"
  | "strategy"
  | "progress"
  | "export";

export default function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("login");

  const navigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Wireframe Header Navigation */}
      <div className="border-b-4 border-black bg-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500">
              PayWise - Conceptual Design
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => navigate("login")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "login"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [1] LOGIN
            </button>
            <button
              onClick={() => navigate("register")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "register"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [2] REGISTER
            </button>
            <button
              onClick={() => navigate("input")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "input"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [3] DATA INPUT
            </button>
            <button
              onClick={() => navigate("dashboard")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "dashboard"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [4] DASHBOARD
            </button>
            <button
              onClick={() => navigate("strategy")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "strategy"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [5] STRATEGY
            </button>
            <button
              onClick={() => navigate("progress")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "progress"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [6] PROGRESS
            </button>
            <button
              onClick={() => navigate("export")}
              className={`px-4 py-2 border-2 border-black text-xs font-mono transition-colors ${
                currentScreen === "export"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              [7] EXPORT
            </button>
          </nav>
        </div>
      </div>

      {/* Screen Content */}
      <div className="py-8">
        {currentScreen === "login" && (
          <WireframeLogin onNavigate={navigate} />
        )}
        {currentScreen === "register" && (
          <WireframeRegister onNavigate={navigate} />
        )}
        {currentScreen === "input" && (
          <WireframeInput onNavigate={navigate} />
        )}
        {currentScreen === "dashboard" && (
          <WireframeDashboard onNavigate={navigate} />
        )}
        {currentScreen === "strategy" && (
          <WireframeStrategy onNavigate={navigate} />
        )}
        {currentScreen === "progress" && (
          <WireframeProgress onNavigate={navigate} />
        )}
        {currentScreen === "export" && (
          <WireframeExport onNavigate={navigate} />
        )}
      </div>

      {/* Footer */}
      <div className="border-t-4 border-black bg-gray-100 p-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-mono">
              ═══════════════════════════════════════════════════
            </div>
            <div className="font-mono text-sm">
              PAYWISE WIREFRAME
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}