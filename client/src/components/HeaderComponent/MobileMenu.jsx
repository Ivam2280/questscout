import HeaderAuthAction from "./HeaderAuthAction";
import HeaderNavItem from "./HeaderNavItem";
import QuestScoutLogo from "../branding/QuestScoutLogo";

export default function MobileMenu({ links, pathname, isLoggedIn, onClose, onLogout }) {
  return (
    <div
      className="header-mobile-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="header-mobile-panel" aria-label="Mobile navigation">
        <div className="header-mobile-topbar">
          <QuestScoutLogo size={34} />
          <button type="button" className="header-mobile-close" onClick={onClose} aria-label="Close navigation menu">
            ESC
          </button>
        </div>

        <nav className="header-mobile-nav">
          <ul className="header-mobile-list">
            {links.map((link) => (
              <HeaderNavItem
                key={link.to}
                {...link}
                onClick={onClose}
                isActive={pathname === link.to}
                isMobile
              />
            ))}
            <li className="header-mobile-auth">
              <HeaderAuthAction
                isLoggedIn={isLoggedIn}
                onLogout={onLogout}
                onNavigate={onClose}
                isMobile
              />
            </li>
          </ul>
        </nav>

        <p className="header-mobile-caption">Quest Room Experience</p>
      </aside>
    </div>
  );
}
