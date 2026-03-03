import { useNavigate } from "react-router-dom";

export function useLogout() {
  const navigate = useNavigate();

  return async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // If server is unreachable, still clear locally and redirect
    } finally {
      localStorage.removeItem("userName");
      navigate("/login");
    }
  };
}