import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess(data.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch {
      setError("Server is not responding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-line" />
      
      <div className="page-content">
        <div className="app-title">PAYWISE</div>

        {success && (
          <div className="alert-wrapper">
            <div className="custom-alert success">
              {success}
            </div>
          </div>
                )}
        
        {error && (
          <div className="alert-wrapper">
            <div className="custom-alert error">
              {error}
            </div>
          </div>
        )}

     
        <div className="login-card">
          <div className="login-title">Create Account</div>

          <form onSubmit={handleRegister}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <button type="submit">REGISTER</button>
        </form>

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