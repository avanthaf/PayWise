type Props = {
  setScreen: (screen: string) => void;
};

function Register({ setScreen }: Props) {
  return (
    <div>
      <h2>REGISTER</h2>

      <input type="text" placeholder="Full Name" />
      <br /><br />

      <input type="email" placeholder="Email" />
      <br /><br />

      <input type="password" placeholder="Password" />
      <br /><br />

      <button onClick={() => setScreen("login")}>
        CREATE ACCOUNT
      </button>

      <br /><br />

      <button onClick={() => setScreen("login")}>
        BACK TO LOGIN
      </button>
    </div>
  );
}

export default Register;
