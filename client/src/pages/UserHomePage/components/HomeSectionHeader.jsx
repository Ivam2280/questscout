import { Link } from "react-router-dom";

export default function HomeSectionHeader({ title, accent, linkTo, linkLabel }) {
  return (
    <header className="home-section-header">
      <div className="home-section-heading-row">
        <h2 className="qs-display">
          {title} <span>{accent}</span>
        </h2>
        {linkTo && linkLabel ? (
          <Link className="home-section-link" to={linkTo}>
            {linkLabel} <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
