import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link } from "react-router-dom";

export default function HeaderAuthAction({ isLoggedIn, onLogout, onNavigate, isMobile = false, linkRef }) {
  const commonStyle = {
    display: "flex",
    width: isMobile ? "100%" : "auto",
    alignItems: "center",
    gap: 8,
    padding: isMobile ? "12px 16px" : "8px 16px",
    borderRadius: isMobile ? 8 : 6,
    fontFamily: "Barlow, 'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    cursor: "pointer",
  };

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={onLogout}
        style={{
          ...commonStyle,
          border: "1px solid rgba(192,57,43,0.4)",
          color: "#c0392b",
          background: "transparent",
        }}
      >
        <LogoutIcon sx={{ fontSize: 16 }} />
        <span>Logout</span>
      </button>
    );
  }

  return (
    <Link
      ref={linkRef}
      to="/login"
      onClick={onNavigate}
      style={{
        ...commonStyle,
        border: "1px solid rgba(192,57,43,0.5)",
        color: "#fff",
        background: "rgba(192,57,43,0.18)",
        textDecoration: "none",
      }}
    >
      <LoginIcon sx={{ fontSize: 16 }} />
      <span>Login</span>
    </Link>
  );
}
