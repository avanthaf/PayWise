import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

type AuthState = "checking" | "authenticated" | "unauthenticated";

export default function ProtectedRoute({ children }: Props) {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    let cancelled = false;

    fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          res.json().then((data) => {
            localStorage.setItem("userName", data.name);
            setAuthState("authenticated");
          });
        } else {
          localStorage.removeItem("userName");
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = localStorage.getItem("userName");
          setAuthState(fallback ? "authenticated" : "unauthenticated");
        }
      });

    return () => { cancelled = true; };
  }, []);

  if (authState === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: "1rem",
          letterSpacing: "0.1rem",
        }}
      >
        VERIFYING SESSION…
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}