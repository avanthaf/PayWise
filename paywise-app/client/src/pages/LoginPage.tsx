import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
         localStorage.setItem("userName", data.name);
        navigate("/input");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="page">
      <div className="page-line" />

      <div className="page-content">
        <div className="app-title">PAYWISE</div>

        <div className="login-card">
          <div className="login-title">Login</div>

            <form onSubmit={handleLogin}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">LOGIN</button>
          </form>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="login-footer">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>

      <div className="page-line" />
    </div>
  );
};