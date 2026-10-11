import "./carwash.css";
import {
  ORCHESTRATION_FEE_LABEL,
  orchestrationFeeArgument,
} from "../../../pricing/orchestrationFee";

const FEE = orchestrationFeeArgument();

const ROWS = [
  ["Peak Demand Diagnostic", "Free", "Never"],
  [
    "Certified Configuration",
    "$2,500 per site · $1,500 for 10+",
    "When you want a lender-ready document",
  ],
  ["Project orchestration", ORCHESTRATION_FEE_LABEL, "Only if you build, on completion"],
  ["Demand response", "$0 to you", "Paid by the aggregator, disclosed below"],
];

export default function HowWeGetPaidPage() {
  return (
    <div className="merlin-cw">
      <nav>
        <div className="wrap navin">
          <a className="logo" href="/">
            <span className="dot" />
            Merlin Energy
          </a>
          <div className="navlinks">
            <a href="/diagnostic">Diagnostic</a>
            <a href="/#how">How it works</a>
          </div>
          <a className="btn btn-p btn-sm" href="/#start">
            Price my peak
          </a>
        </div>
      </nav>
      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <span className="eyebrow">How we get paid</span>
          <h1 style={{ marginTop: 12 }}>We're paid by you. That's the whole point.</h1>
          <p className="sub">
            Most energy consultants are paid by the companies they recommend. The fee is built into
            the rate, and you never see it. This page says what we charge, what a third party pays
            us, and what we refuse. No subscription. No retainer. Nothing charged unless you decide
            to act.
          </p>
          <div className="card" style={{ marginTop: 28 }}>
            {ROWS.map(([what, cost, when]) => (
              <div className="brow" key={what}>
                <span>{what}</span>
                <span style={{ textAlign: "right" }}>
                  <b>{cost}</b>
                  <br />
                  <span style={{ color: "#5C6F66", fontWeight: 500 }}>{when}</span>
                </span>
              </div>
            ))}
            <p style={{ marginTop: 14 }}>
              If the project doesn't pencil, you pay nothing and we tell you why.
            </p>
          </div>

          <div className="card">
            <h3>The diagnostic stays free</h3>
            <p style={{ marginTop: 8 }}>
              One bill. A range. What's recoverable. Which path fits — storage, demand response, or
              a rate correction. Every input is labeled certified or estimated. No card and no
              discovery call first.
            </p>
          </div>
          <div className="card">
            <h3>Certified Configuration — $2,500 per site</h3>
            <p style={{ marginTop: 8 }}>
              The rate schedule, billed demand, power factor, and any ratchet, checked against the
              bill. An 8,760-hour model. A vendor-neutral spec you can bid. $1,500 per site for ten
              or more. If you build with us, the $2,500 is credited against orchestration. You can
              take the spec and build it yourself and owe nothing further.
            </p>
          </div>
          <div className="card">
            <h3>{FEE.heading}</h3>
            <p style={{ marginTop: 8 }}>
              {ORCHESTRATION_FEE_LABEL}. {FEE.claim ? `${FEE.claim} ` : ""}
              Quoted up front, invoiced on completion. Bidding, interconnection, incentives, and a
              check that the savings showed up are the work.
            </p>
          </div>
          <div className="honest">
            <b>You charge for orchestration — aren't you incentivised to tell me to build?</b>
            <p>
              Partly, yes. That's why {FEE.reason}, why demand response is the recommendation when
              it wins, why the configuration fee is credited back, and why the spec is yours if you
              build without us.
            </p>
          </div>
          <div className="card">
            <h3>Demand response is the one place a third party pays us</h3>
            <p style={{ marginTop: 8 }}>
              The aggregator pays a referral on enrolled capacity. You see the gross value and our
              share as separate lines. If you'd rather we be paid by you, we rebate the referral and
              invoice you the same amount.
            </p>
          </div>
          <div className="card">
            <h3>What we never do</h3>
            <p style={{ marginTop: 8 }}>
              No commission from a solar, storage, or EV vendor. No subscription. No sale of your
              data. No estimate labeled certified. No other utility's rate on your territory — Long
              Island gets PSEG Long Island, not Con Edison. No lock-in on the spec.
            </p>
          </div>
          <p style={{ marginTop: 22 }}>
            Installers who want to be in the bid set can write{" "}
            <a href="mailto:sales@merlinenergy.net?subject=Installer%20bid%20set">
              sales@merlinenergy.net
            </a>
            .
          </p>
          <p className="fineprint" style={{ textAlign: "left", marginTop: 18 }}>
            Merlin Energy is not a licensed engineering firm. Certified configurations are produced
            with a licensed professional engineer. Estimates stay labeled as estimates.
          </p>
        </div>
      </section>
    </div>
  );
}
