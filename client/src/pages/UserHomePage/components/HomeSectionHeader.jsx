import { Link } from "react-router-dom";

export default function HomeSectionHeader({ eyebrow, title, accent, linkTo, linkLabel }) {
  return (
    <header className="home-section-header">
      <div className="home-section-eyebrow">
        <span aria-hidden="true" />
        <p className="qs-condensed">{eyebrow}</p>
      </div>

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
