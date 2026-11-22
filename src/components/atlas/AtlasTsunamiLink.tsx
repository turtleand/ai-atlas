import { Link } from "react-router-dom";

export function AtlasTsunamiLink({
  placement = "footer",
}: {
  placement?: "chart" | "footer";
}) {
  return (
    <Link to="/tsunami/" className={`atlas-tsunami-link is-${placement}`}>
      <svg viewBox="0 0 52 44" aria-hidden="true">
        <path className="atlas-wave-horizon" d="M3 38h45M6 41h32" />
        <g className="atlas-nav-wave">
          <path d="M4 35c10-1 9-16 16-24C28 1 43 4 46 16c-5-7-13-7-17-1-5 8 4 14 15 12-3 9-12 12-23 11Z" />
          <path
            className="atlas-wave-foam"
            d="M14 26c3-9 4-18 15-19 7-1 12 2 15 6M26 15c-7 12 6 20 14 15"
          />
          <path className="atlas-wave-seam" d="m6 34 11-2 6 3 9-1" />
        </g>
      </svg>
      <span>Tsunami</span>
      <span className="atlas-nav-arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
