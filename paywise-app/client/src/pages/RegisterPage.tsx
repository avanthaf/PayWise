import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      alert("Account created successfully!");
      navigate("/"); // Redirect to login
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="page">
      <div className="page-line" />

      <div className="page-content">
        <div className="app-title">PAYWISE</div>

        <div className="login-card">
          <div className="login-title">Create Account</div>

          <label>Name</label>
          <input
            type="name"
            placeholder="Enter your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleRegister}>Register</button>

          <div className="login-footer">
            Already have an account?{" "}
            <Link to="/">Login</Link>
          </div>
        </div>
      </div>

      <div className="page-line" />
    </div>
  );
};

export default RegisterPage;