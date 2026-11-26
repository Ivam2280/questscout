import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import QuestScoutLogo from "../branding/QuestScoutLogo";
import "./Footer.css";

const EXPLORE_LINKS = [
  { to: "/escaperooms", label: "Quest Rooms" },
  { to: "/howtobook", label: "How to Book" },
  { to: "/rules", label: "Rules" },
];

const ACCOUNT_LINKS = [
  { to: "/mybookings", label: "My Bookings" },
  { to: "/booking-history", label: "History" },
  { to: "/myaccount", label: "Profile" },
];

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h2 className="footer-heading">{title}</h2>
      <ul className="footer-link-list">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterContact() {
  return (
    <div>
      <h2 className="footer-heading">Contact</h2>
      <ul className="footer-contact-list">
        <li>
          <a href="mailto:questscout@gmail.com">
            <Mail size={16} aria-hidden="true" />
            questscout@gmail.com
          </a>
        </li>
        <li>
          <a href="tel:+380501234567">
            <Phone size={16} aria-hidden="true" />
            +380 50 123 4567
          </a>
        </li>
        <li className="footer-address">
          <MapPin size={16} aria-hidden="true" />
          <span>
            Pr. Nauky, 14
            <br />
            Kharkiv, Kharkiv Oblast
            <br />
            Ukraine
          </span>
        </li>
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <QuestScoutLogo size={44} paddingLeft={0} />
          <p>
            Immersive quest room experiences. Book your next adventure and escape
            the ordinary.
          </p>
        </div>
        <FooterLinkColumn title="Explore" links={EXPLORE_LINKS} />
        <FooterLinkColumn title="Account" links={ACCOUNT_LINKS} />
        <FooterContact />
      </div>

      <div className="footer-divider" />
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} QuestScout. All rights reserved.</p>
      </div>
    </footer>
  );
}
