import { useState } from "react"
import Login from "./pages/LoginPage"
import PageLayout from "./components/PageLayout"
import "./styles/global.css"

export default function App() {
  const [screen, setScreen] = useState("login")

  return (
    <PageLayout>
      {screen === "login" && <Login setScreen={setScreen} />}
    </PageLayout>
  )
}
