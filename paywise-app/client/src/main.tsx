import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import InputPage from "./pages/InputPage";
import StrategyPage from "./pages/StrategyPage";
import ProgressPage from "./pages/ProgressPage";
import DashboardPage from "./pages/DashboardPage";
import ExportPage from "./pages/ExportPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — JWT cookie verified on every mount */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/input"     element={<ProtectedRoute><InputPage /></ProtectedRoute>} />
      <Route path="/strategy"  element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
      <Route path="/progress"  element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/export"    element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);