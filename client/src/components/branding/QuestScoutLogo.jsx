import { useId } from "react";
import { Link } from "react-router-dom";

export default function QuestScoutLogo({ size = 56, paddingLeft = 15 }) {
  const id = useId().replace(/:/g, "");
  const badgeGradientId = `badge-gradient-${id}`;
  const scoutGradientId = `scout-gradient-${id}`;

  return (
    <Link
      to="/"
      aria-label="QuestScout home"
      style={{ display: "flex", alignItems: "center", flexShrink: 0, paddingLeft, textDecoration: "none" }}
    >
      <svg
        width={size * 5}
        height={size}
        viewBox="0 0 280 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={badgeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6347" />
            <stop offset="100%" stopColor="#e8402c" />
          </linearGradient>
          <linearGradient id={scoutGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6347" />
            <stop offset="100%" stopColor="#e8402c" />
          </linearGradient>
        </defs>
        <rect x="2" y="4" width="48" height="48" rx="13" fill={`url(#${badgeGradientId})`} stroke="#ff6347" strokeWidth="2" />
        <text x="26" y="37" textAnchor="middle" fontFamily="Barlow, sans-serif" fontWeight="900" fontSize="28" fill="#0a0a0b" letterSpacing="1">
          QS
        </text>
        <text x="60" y="41" fontFamily="Barlow, sans-serif" fontWeight="800" fontSize="32" fill="#fff" letterSpacing="1.8">
          QUEST
          <tspan fill={`url(#${scoutGradientId})`} fontWeight="900">SCOUT</tspan>
        </text>
      </svg>
    </Link>
  );
}
