type Props = {
  setScreen: (screen: string) => void;
};

function Dashboard({ setScreen }: Props) {
  return (
    <div>
      <h2>DASHBOARD</h2>

      <button onClick={() => setScreen("input")}>DATA INPUT</button>
      <br /><br />

      <button onClick={() => setScreen("strategy")}>STRATEGY</button>
      <br /><br />

      <button onClick={() => setScreen("progress")}>PROGRESS</button>
      <br /><br />

      <button onClick={() => setScreen("export")}>EXPORT</button>
      <br /><br />

      <button onClick={() => setScreen("login")}>LOGOUT</button>
    </div>
  );
}

export default Dashboard;
