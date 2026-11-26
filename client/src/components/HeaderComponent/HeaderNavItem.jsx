import { Link } from "react-router-dom";

export default function HeaderNavItem({ to, label, onClick, isActive, linkRef, isMobile = false }) {
  return (
    <li>
      <Link
        ref={linkRef}
        to={to}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
          padding: isMobile ? "11px 16px" : "8px 16px",
          borderLeft: isMobile ? (isActive ? "3px solid #c0392b" : "3px solid transparent") : "none",
          borderRadius: isMobile ? 8 : 6,
          color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
          background: isMobile && isActive ? "rgba(192,57,43,0.15)" : "transparent",
          fontFamily: "Barlow, 'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textDecoration: "none",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          transition: "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
        }}
      >
        {label}
      </Link>
    </li>
  );
}
