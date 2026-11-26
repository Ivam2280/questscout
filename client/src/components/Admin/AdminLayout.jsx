import React, { useState, useEffect, useId } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Auth from "../../utils/auth";
import {
  LayoutDashboard,
  DoorOpen,
  CalendarDays,
  Users,
  MessageSquareText,
  LogOut,
  Menu,
  ChevronLeft
} from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    :root {
      --red: #c0392b;
      --red-hi: #e74c3c;
      --ink: #0f0f0f;
      --smoke: #111113;
      --ash: #1c1c1f;
      --fog: #2a2a2f;
      --slate: #8a8a96;
      --pale: #d6d6e0;
      --white: #f0f0f5;
    }

    .admin-page {
      background: var(--ink);
      color: var(--white);
    }

    .admin-page::before {
      content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }
  `}</style>
);

// ─── Admin Logo Component ─────────────────────────────────────────────────────
const AdminLogo = ({ size = 48 }) => {
  const color = "#e8402c";
  const glowColor = "#ff6347";
  const white = "#ffffff";
  const uid = useId();
  const badgeGradientId = `badgeGradient-${uid}`;
  const adminGradientId = `adminGradient-${uid}`;

  return (
    <svg
      width={size * 5.5}
      height={size}
      viewBox="0 0 310 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={badgeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={adminGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      {/* Badge background */}
      <rect
        x="2"
        y="4"
        width="48"
        height="48"
        rx="13"
        fill={`url(#${badgeGradientId})`}
        stroke={glowColor}
        strokeWidth="2"
      />

      {/* QA text in badge */}
      <text
        x="26"
        y="37"
        textAnchor="middle"
        fontFamily="'Barlow', sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#0a0a0b"
        letterSpacing="1"
      >
        QA
      </text>

      {/* QUEST text */}
      <text
        x="60"
        y="41"
        fontFamily="'Barlow', sans-serif"
        fontWeight="800"
        fontSize="32"
        fill={white}
        letterSpacing="1.8"
      >
        QUEST
        <tspan fill={`url(#${adminGradientId})`} fontWeight="900">ADMIN</tspan>
      </text>
    </svg>
  );
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  // Оновлення часу
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!Auth.loggedIn() || !Auth.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    Auth.logout();
    window.location.replace("/");
  };

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/rooms", icon: DoorOpen, label: "Rooms" },
    { path: "/admin/bookings", icon: CalendarDays, label: "Bookings" },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/reviews", icon: MessageSquareText, label: "Reviews" },
  ];

  return (
    <>
      <GlobalStyles />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="admin-page flex h-screen overflow-hidden relative font-['DM_Sans',sans-serif]">

        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{
            width: isSidebarOpen ? "260px" : "0px",
            x: isSidebarOpen ? 0 : -260
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed lg:relative z-30 h-full bg-[var(--smoke)] border-r border-[var(--fog)] flex flex-col shrink-0 overflow-hidden"
        >
          <div className="h-20 flex items-center justify-start px-6 border-b border-[var(--fog)] shrink-0">
            <Link to="/admin" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <AdminLogo size={46} />
            </Link>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto z-10">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-300 ${
                    isActive
                      ? "bg-[rgba(192,57,43,0.1)] text-[var(--white)] border border-[rgba(192,57,43,0.3)] shadow-[0_0_15px_rgba(192,57,43,0.2)]"
                      : "text-[var(--slate)] border border-transparent hover:bg-[rgba(255,255,255,0.02)] hover:border-[var(--fog)] hover:text-[var(--pale)]"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-[var(--red)]" : "text-[var(--slate)]"} />
                  <span className="text-sm tracking-widest uppercase font-bold mt-0.5">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--fog)] shrink-0 z-10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded text-[var(--slate)] hover:bg-[rgba(192,57,43,0.1)] hover:text-[var(--red-hi)] transition-all duration-300 group border border-transparent hover:border-[rgba(192,57,43,0.3)]"
            >
              <LogOut size={18} className="group-hover:text-[var(--red-hi)] transition-colors" />
              <span className="text-sm tracking-widest uppercase font-bold mt-0.5">Logout</span>
            </button>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

          <header className="h-20 bg-[var(--smoke)] border-b border-[var(--fog)] flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-[var(--slate)] hover:text-[var(--white)] bg-[rgba(255,255,255,0.02)] border border-[var(--fog)] hover:border-[var(--red)] p-2.5 rounded transition-all duration-300 focus:outline-none"
              >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Годинник зі збільшеною датою */}
            <div className="flex flex-col items-end justify-center">
              <span className="text-xl font-extrabold tracking-wider text-[var(--white)] leading-none mb-1">
                {currentTime.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--slate)] leading-none">
                {currentTime.toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--ink)] p-6 md:p-8 relative">
            <Outlet />
          </main>

        </div>
      </div>
    </>
  );
};

export default AdminLayout;
