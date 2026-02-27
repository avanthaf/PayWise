type Props = {
  setScreen: (screen: string) => void
}

function Login({ setScreen }: Props) {
  return (
    <>
      <div className="app-title">PayWise</div>

      <div className="login-card">
        <div className="login-title">LOGIN</div>

        <label>EMAIL ADDRESS:</label>
        <input type="email" placeholder="[email@example.com]" />

        <label>PASSWORD:</label>
        <input type="password" placeholder="[••••••••]" />

        <button onClick={() => setScreen("dashboard")}>
          LOGIN
        </button>

        <div className="login-footer">
          Don&apos;t have an account?{" "}
          <span onClick={() => setScreen("register")}>
            CREATE ACCOUNT
          </span>
        </div>
      </div>
    </>
  )
}

export default Login
