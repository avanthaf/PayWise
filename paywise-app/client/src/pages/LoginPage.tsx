import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="page">
      <div className="page-line" />

      <div className="page-content">
        <div className="app-title">PAYWISE</div>

        <div className="login-card">
          <div className="login-title">Login</div>

          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <button>Login</button>

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

export default LoginPage;