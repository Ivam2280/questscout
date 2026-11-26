import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Auth from "../../utils/auth";
import HeaderAuthAction from "./HeaderAuthAction";
import HeaderNavItem from "./HeaderNavItem";
import MobileMenu from "./MobileMenu";
import QuestScoutLogo from "../branding/QuestScoutLogo";
import "./Header.css";

const PUBLIC_LINKS = [{ to: "/escaperooms", label: "Quest Rooms" }];
const USER_LINKS = [
  { to: "/mybookings", label: "Bookings" },
  { to: "/booking-history", label: "History" },
  { to: "/myaccount", label: "Account" },
];
const INFO_LINKS = [
  { to: "/rules", label: "Rules" },
  { to: "/howtobook", label: "How to Book" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [indicator, setIndicator] = useState({ opacity: 0, width: 0, height: 0, transform: "translate(0, 0)" });
  const { pathname } = useLocation();
  const navListRef = useRef(null);
  const linksRef = useRef({});
  const isLoggedIn = Auth.loggedIn();
  const links = [...PUBLIC_LINKS, ...(isLoggedIn ? USER_LINKS : []), ...INFO_LINKS];

  const updateIndicator = useCallback(() => {
    const activeLink = linksRef.current[pathname];
    const container = navListRef.current;
    if (!activeLink || !container) {
      setIndicator((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const linkRect = activeLink.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicator({
      opacity: 1,
      width: linkRect.width,
      height: linkRect.height,
      transform: `translate(${linkRect.left - containerRect.left}px, ${linkRect.top - containerRect.top}px)`,
    });
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    Auth.logout();
  };

  return (
    <>
      <header className={`site-header${scrolled ? " site-header-scrolled" : ""}`}>
        <div className="header-desktop-only">
          <QuestScoutLogo size={46} paddingLeft={0} />
        </div>
        <div className="header-mobile-only">
          <QuestScoutLogo size={38} paddingLeft={0} />
        </div>

        <nav className="header-desktop-nav header-desktop-only" ref={navListRef} aria-label="Primary navigation">
          <span className="header-active-indicator" style={indicator} aria-hidden="true">
            <span />
          </span>
          <ul className="header-desktop-list">
            {links.map((link) => (
              <HeaderNavItem
                key={link.to}
                {...link}
                isActive={pathname === link.to}
                linkRef={(element) => {
                  linksRef.current[link.to] = element;
                }}
              />
            ))}
            <li className="header-divider" aria-hidden="true" />
            <li>
              <HeaderAuthAction isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="header-menu-button header-mobile-only"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {isMenuOpen ? (
        <MobileMenu
          links={links}
          pathname={pathname}
          isLoggedIn={isLoggedIn}
          onClose={() => setIsMenuOpen(false)}
          onLogout={handleLogout}
        />
      ) : null}
    </>
  );
}
