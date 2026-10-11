import "./carwash.css";

const KEEP = [
  ["/", "Car wash homepage", "ZIP first. A bill is optional, and it is what certifies the peak."],
  ["/diagnostic", "Peak Demand Diagnostic", "Estimate from a ZIP. Certified only from the bill."],
  ["/how-we-get-paid", "How we get paid", "Also served at /pricing. No subscription."],
  ["/bill", "Bill upload", "Reads the bill. Does not invent a precision claim."],
  ["/opportunities", "Opportunity inbox", "Scraper output, now weighted to car washes."],
  ["/news", "Energy news", "Market news, including car-wash business and regulatory items."],
];

const PARKED = [
  ["/hotel", "Hotel"],
  ["/ev-charging", "EV charging"],
  ["/data-center", "Data center"],
  ["/hospital", "Hospital"],
  ["/manufacturing", "Manufacturing"],
  ["/retail", "Retail"],
  ["/warehouse", "Warehouse"],
  ["/office", "Office"],
  ["/gas-station", "Gas station"],
  ["/cold-storage", "Cold storage"],
  ["/shopping-center", "Shopping center"],
  ["/casino", "Casino"],
  ["/airport", "Airport"],
  ["/college", "College"],
  ["/microgrid", "Microgrid"],
];

const RETIRE = [
  ["/widget", "Widget and API docs", "Marked not offered. Remove in the same release as deploy."],
  ["/account", "Subscription dashboard", "Real Stripe subscriptions still work. No new plans."],
  [
    "/wizard",
    "Former wizard URL",
    "Serves the diagnostic. /wizard-v8, /v8, /wizard-v6, and /vnext redirect there.",
  ],
  [
    "/wizard-v8",
    "Former national wizard",
    "Redirects to the diagnostic. The engine code is not a public page.",
  ],
];

export default function SitePagesPage() {
  return (
    <div className="merlin-cw">
      <nav>
        <div className="wrap navin">
          <a className="logo" href="/">
            <span className="dot" />
            Merlin Energy
          </a>
          <a className="btn btn-p btn-sm" href="/diagnostic">
            See an instant estimate
          </a>
        </div>
      </nav>
      <section>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <span className="eyebrow">Site pages</span>
          <h1 style={{ marginTop: 12 }}>What stays, what's parked, what goes at deploy.</h1>
          <p className="sub">
            The homepage uses violet for brand and green only for a verified tick. The diagnostic
            and the quote keep green #0FA968. The old quote wizard is no longer a public route. Its
            calculation code remains in the repo and is not the tariff authority. Industry URLs stay
            up until the deploy that retires them. Their quote buttons no longer open the wizard.
          </p>
          <div className="card">
            <h3>Keep</h3>
            {KEEP.map(([href, title, note]) => (
              <div className="trow" key={href}>
                <span>
                  <a href={href}>
                    <b>{title}</b>
                  </a>
                  <br />
                  <span style={{ color: "#5C6F66" }}>
                    {href} — {note}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Parked — still routed, not the offer</h3>
            <p style={{ margin: "8px 0 12px" }}>
              These pages still open. They are not linked from the homepage, and they should not
              carry the car-wash promise.
            </p>
            {PARKED.map(([href, title]) => (
              <div className="trow" key={href}>
                <span className="u">{title}</span>
                <a href={href}>{href}</a>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Retire in the deploy release</h3>
            {RETIRE.map(([href, title, note]) => (
              <div className="trow" key={href}>
                <span>
                  <b>{title}</b>
                  <br />
                  <span style={{ color: "#5C6F66" }}>
                    {href} — {note}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
