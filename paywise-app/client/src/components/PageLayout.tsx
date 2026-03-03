import { useNavigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { path: "/dashboard", label: "DASHBOARD" },
  { path: "/input",     label: "INPUT"     },
  { path: "/strategy",  label: "STRATEGY"  },
  { path: "/progress",  label: "PROGRESS"  },
  { path: "/export",    label: "EXPORT"    },
];

export default function PageLayout({ children }: Props) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userName  = localStorage.getItem("userName");

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch { /* Clears locally */ }
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <div className="page">
      <nav style={{
        width: "100%",
        borderBottom: "3px solid #000",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 40px",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0",
        }}>

          {/* Brand */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              width: "auto",
              padding: "14px 20px 14px 0",
              border: "none",
              background: "transparent",
              fontWeight: "bold",
              fontSize: "1.1rem",
              letterSpacing: "0.15rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            PAYWISE
          </button>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "0", flex: 1 }}>
            {NAV_LINKS.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  width: "auto",
                  padding: "0 16px",
                  border: "none",
                  borderBottom: isActive(path) ? "3px solid #000" : "3px solid transparent",
                  marginBottom: isActive(path) ? "-3px" : "-3px",
                  background: "transparent",
                  fontSize: "0.78rem",
                  fontWeight: isActive(path) ? "bold" : "normal",
                  letterSpacing: "0.06rem",
                  cursor: "pointer",
                  color: isActive(path) ? "#000" : "#555",
                  transition: "color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#000"; }}
                onMouseLeave={(e) => { if (!isActive(path)) (e.currentTarget as HTMLButtonElement).style.color = "#555"; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* User + logout */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 0",
            flexShrink: 0,
          }}>
            {userName && (
              <span style={{ fontSize: "0.8rem", color: "#666", whiteSpace: "nowrap" }}>
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: "auto",
                padding: "6px 14px",
                border: "2px solid #000",
                background: "#fff",
                fontSize: "0.78rem",
                fontWeight: "bold",
                letterSpacing: "0.06rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
            >
              LOGOUT
            </button>
          </div>

        </div>
      </nav>
      <div style={{ flex: 1, paddingTop: "32px", paddingBottom: "60px" }}>
        {children}
      </div>

    </div>
  );
}