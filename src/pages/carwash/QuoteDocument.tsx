import { useState, type FormEvent } from "react";
import type { ApiQuote, QuoteRequestContext, QuoteTierKey } from "./quoteApi";

const TIERS: { key: QuoteTierKey; label: string }[] = [
  { key: "starter", label: "Starter" },
  { key: "recommended", label: "Recommended" },
  { key: "complete", label: "Complete" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusWord(status: QuoteRequestContext["peakStatus"]) {
  if (status === "certified") return "Certified";
  if (status === "entered") return "You entered this";
  if (status === "provisional") return "Provisional";
  return "Estimated";
}

function tagStatus(tag: string): "certified" | "estimated" {
  return tag === "verified" ? "certified" : "estimated";
}

export default function QuoteDocument({
  quote,
  place,
  washLabel,
  cars,
  days,
  utilityName,
  rateSchedule,
  context,
  onBill,
}: {
  quote: ApiQuote;
  place: string;
  washLabel: string;
  cars: string;
  days: string;
  utilityName: string;
  rateSchedule: string;
  context: QuoteRequestContext;
  onBill?: (file: File) => void;
}) {
  const [tierKey, setTierKey] = useState<QuoteTierKey>("recommended");
  const [ask, setAsk] = useState<null | "survey" | "certify" | "engineer" | "save">(null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    consent: false,
    company_website_url: "",
  });
  const [sent, setSent] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const tier = quote.tiers[tierKey];
  const peak = quote.inputs.facilityParams.peakLoadKW;
  const rate = quote.inputs.facilityParams.demandCharge;
  const confidence = quote.confidence;
  const high = confidence.tier.startsWith("HIGH");
  const provisional =
    confidence.tier.startsWith("PROVISIONAL") || context.rateStatus === "provisional";
  const certifiedQuote = context.peakStatus === "certified" && high;
  const badge = certifiedQuote
    ? "Certified quote"
    : provisional
      ? "Provisional quote"
      : "Estimated quote";
  const vendor = [quote.equipmentSelection?.bess?.vendor, quote.equipmentSelection?.bess?.model]
    .filter(Boolean)
    .join(" ");
  const solar = tier.equipment.solarKW > 0;
  const title = solar ? `${place} — storage and solar quote` : `${place} — battery storage quote`;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!contact.consent || !ask) return;
    setSent("sending");
    setError(null);
    try {
      const response = await fetch("/api/facility-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          industry: "car-wash",
          location: quote.location.formattedAddress,
          intent: ask,
          consent: true,
          system: `${tier.equipment.bessKW} kW / ${tier.equipment.bessKWh} kWh · ${tier.label}`,
          annualSavings: tier.savings.netAnnualSavings,
          paybackYears: tier.roi.paybackYears,
          company_website_url: contact.company_website_url,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false)
        throw new Error(payload.error || "Could not send this");
      setSent("sent");
    } catch (err) {
      setSent("error");
      setError(err instanceof Error ? err.message : "Could not send this");
    }
  }

  const costRows: { label: string; amount: number; deduct?: boolean }[] = [
    { label: "Battery storage", amount: tier.costs.bessCost },
    ...(tier.costs.solarCost > 0 ? [{ label: "Solar", amount: tier.costs.solarCost }] : []),
    ...(tier.costs.generatorCost > 0
      ? [{ label: "Generator", amount: tier.costs.generatorCost }]
      : []),
    { label: "Site engineering", amount: tier.costs.siteEngineering },
    { label: "Construction contingency", amount: tier.costs.constructionContingency },
    { label: "Design", amount: tier.costs.merlinFees.designIntelligence },
    { label: "Procurement", amount: tier.costs.merlinFees.procurementSourcing },
    { label: "Project management", amount: tier.costs.merlinFees.pmConstruction },
    { label: "Incentive filing", amount: tier.costs.merlinFees.incentiveFiling },
  ];

  return (
    <div className="quote-doc" id="quote-doc">
      <span className={`badge ${certifiedQuote ? "" : "warn"}`}>
        <span>{certifiedQuote ? "✓" : "◐"}</span> {badge}
      </span>
      <h1>{title}</h1>
      <p className="sub">
        <b>{washLabel}</b>
        {cars ? <> · ~{cars} cars/day</> : null} · {days} days/week · <b>{utilityName}</b> ·{" "}
        {rateSchedule} · 12-month billing period
      </p>

      <div className="q-bar">
        <span className="q-conf">
          <span className="q-meter">
            <i style={{ width: `${Math.max(0, Math.min(100, confidence.score))}%` }} />
          </span>
          <span className="q-sc">{confidence.score}</span>
          <span className="q-lb">· {confidence.description}</span>
        </span>
        <span className="q-tiers" role="tablist" aria-label="Quote tier">
          {TIERS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tierKey === item.key}
              className={tierKey === item.key ? "on" : ""}
              onClick={() => setTierKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </span>
      </div>

      <div className="q-grid">
        <div>
          <div className="q-card">
            <h2 className="hd">What we're proposing</h2>
            <div className="bd">
              <div className="sysname num">
                {tier.equipment.bessKW} kW / {tier.equipment.bessKWh} kWh battery storage
              </div>
              <p className="sysmeta">
                {tier.equipment.durationHrs}-hour duration · behind the meter, no export
              </p>
              <ul className="spec">
                <li>
                  <span>Power</span>
                  <span className="num">{tier.equipment.bessKW} kW</span>
                </li>
                <li>
                  <span>Battery</span>
                  <span className="num">
                    {tier.equipment.bessKWh} kWh{vendor ? ` · ${vendor}` : ""}
                  </span>
                </li>
                {solar && (
                  <li>
                    <span>Solar</span>
                    <span className="num">
                      {tier.equipment.solarKW} kW · {quote.solar.peakSunHours} peak sun hours
                    </span>
                  </li>
                )}
                {tier.equipment.generatorKW > 0 && (
                  <li>
                    <span>Generator</span>
                    <span className="num">{tier.equipment.generatorKW} kW</span>
                  </li>
                )}
                <li>
                  <span>Controls</span>
                  <span>Peak shave, sized by this tier</span>
                </li>
                <li>
                  <span>Interconnection</span>
                  <span>No export — no utility study required</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="q-card">
            <h2 className="hd">What it saves you each year</h2>
            <div className="bd">
              <table className="money">
                <tbody>
                  <tr>
                    <td>
                      Demand charge reduction
                      {tier.savings.shaveCapped && (
                        <span>
                          {" "}
                          ({tier.savings.creditedShaveKW} kW credited of {tier.equipment.bessKW} kW)
                        </span>
                      )}
                    </td>
                    <td className="num">{money(tier.savings.demandChargeSavings)}</td>
                  </tr>
                  {tier.savings.solarSavings > 0 && (
                    <tr>
                      <td>Solar production</td>
                      <td className="num">{money(tier.savings.solarSavings)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Less operating reserves</td>
                    <td className="num neg">−{money(tier.savings.annualReserves)}</td>
                  </tr>
                  <tr className="rule total">
                    <td>Net annual savings</td>
                    <td className="num">{money(tier.savings.netAnnualSavings)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="micro num">
                Against an annual demand charge of <b>{money(peak * rate * 12)}</b> at $
                {rate.toFixed(2)}/kW-mo.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="q-card">
            <h2 className="hd">What it costs</h2>
            <div className="bd">
              <table className="money">
                <tbody>
                  {costRows
                    .filter((row) => row.amount > 0)
                    .map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td className="num">{money(row.amount)}</td>
                      </tr>
                    ))}
                  <tr className="rule">
                    <td>Total installed</td>
                    <td className="num">{money(tier.costs.totalInvestment)}</td>
                  </tr>
                  <tr>
                    <td>Federal ITC (30%, IRA §48)</td>
                    <td className="num neg">−{money(tier.costs.federalITC)}</td>
                  </tr>
                  <tr className="rule total">
                    <td>Your net cost</td>
                    <td className="num">{money(tier.costs.netInvestment)}</td>
                  </tr>
                  <tr>
                    <td>Return capital (battery and solar, after the ITC)</td>
                    <td className="num">{money(tier.costs.returnCapital.investment)}</td>
                  </tr>
                  {tier.costs.complianceCapital.investment > 0 && (
                    <tr>
                      <td>Compliance capital (generator — not in the payback)</td>
                      <td className="num">{money(tier.costs.complianceCapital.investment)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="micro">
                Merlin's fee is ${tier.costs.merlinFees.totalFee.toLocaleString("en-US")} of the
                equipment subtotal ({Math.round(tier.costs.merlinFees.effectiveMargin * 100)}%),
                plus ${tier.costs.merlinFees.annualMonitoring}/yr monitoring. Monitoring is not in
                the net cost.
                {tier.costs.complianceCapital.investment > 0 && tier.blendedRoi && (
                  <>
                    {" "}
                    Payback below is on the battery and solar. The generator is compliance capital
                    and is not in it. All-in payback is {tier.blendedRoi.paybackYears} years.
                  </>
                )}
              </p>
              <div className="returns">
                <div>
                  <div className="k">Payback</div>
                  <div className="v num">
                    {tier.roi.paybackYears >= 100 ? (
                      "—"
                    ) : (
                      <>
                        {tier.roi.paybackYears} <small>years</small>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="k">ROI over 10 yrs</div>
                  <div className="v num">
                    {tier.roi.roi10Year == null ? (
                      "—"
                    ) : (
                      <>
                        {tier.roi.roi10Year}
                        <small>%</small>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="k">NPV</div>
                  <div className="v num">{money(tier.roi.npv25Year)}</div>
                </div>
                <div>
                  <div className="k">ROI over 25 yrs</div>
                  <div className="v num">
                    {tier.roi.roi25Year == null ? (
                      "—"
                    ) : (
                      <>
                        {tier.roi.roi25Year}
                        <small>%</small>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="q-mc">
                {(["p10", "p50", "p90"] as const).map((key) => (
                  <div key={key}>
                    <div className="k">{quote.monteCarlo[key].label}</div>
                    <div className="v num">
                      {quote.monteCarlo[key].paybackYears} <small>yr</small>
                    </div>
                    <div className="s num">{quote.monteCarlo[key].annualSavings}/yr</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="q-ctas no-print">
            <button
              className="q-btn primary"
              type="button"
              onClick={() => {
                setAsk("survey");
                setSent("idle");
              }}
            >
              Accept &amp; schedule survey →
            </button>
            <button className="q-btn ghost" type="button" onClick={() => window.print()}>
              Download this quote as PDF
            </button>
            <p className="micro">No commitment. The quote is yours to keep.</p>
          </div>
        </div>
      </div>

      <div className="q-card prov">
        <h2 className="hd">Where every number comes from</h2>
        <div className="bd">
          <table className="prov">
            <tbody>
              <tr>
                <td className={context.peakStatus === "certified" ? "cert" : "est"}>
                  <span className="glyph">{context.peakStatus === "certified" ? "✓" : "◐"}</span>
                  Billed demand — {peak} kW
                </td>
                <td className="src">{context.peakSourceText}</td>
                <td className={context.peakStatus === "certified" ? "st cert" : "st est"}>
                  {statusWord(context.peakStatus)}
                </td>
              </tr>
              <tr>
                <td className={context.rateStatus === "certified" ? "cert" : "est"}>
                  <span className="glyph">{context.rateStatus === "certified" ? "✓" : "◐"}</span>
                  Demand charge — ${rate.toFixed(2)}/kW-mo
                </td>
                <td className="src">{context.rateSourceText}</td>
                <td className={context.rateStatus === "certified" ? "st cert" : "st est"}>
                  {statusWord(context.rateStatus)}
                </td>
              </tr>
              <tr>
                <td className="cert">
                  <span className="glyph">✓</span>Federal ITC — 30%
                </td>
                <td className="src">Inflation Reduction Act §48</td>
                <td className="st cert">Certified</td>
              </tr>
              {Object.entries(quote.provenance).map(([key, line]) => {
                const certain = tagStatus(line.tag) === "certified";
                return (
                  <tr key={key}>
                    <td className={certain ? "cert" : "est"}>
                      <span className="glyph">{certain ? "✓" : "◐"}</span>
                      {key.replace(/_/g, " ")}
                    </td>
                    <td className="src">{line.source}</td>
                    <td className={certain ? "st cert" : "st est"}>
                      {certain ? "Certified" : "Estimated"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="q-next">
        <h3>Two ways to take this further</h3>
        <p>
          This quote is complete — it does not expire and it does not require a call. If you want it
          firm, there are two upgrades, and you choose which:
        </p>
        <ol>
          <li>
            <b>Verify it against your bill.</b> Send the PDF and the estimated lines above become
            certified. You get a revised quote, usually within one business day.
          </li>
          <li>
            <b>Accept and schedule the survey.</b> We confirm the switchgear, the interconnect point
            and the pad, then lock the price.
          </li>
        </ol>
        <div className="row no-print">
          <button
            className="q-btn primary"
            type="button"
            onClick={() => {
              setAsk("certify");
              setSent("idle");
            }}
          >
            Send my bill to certify
          </button>
          <button
            className="q-btn ghost"
            type="button"
            onClick={() => {
              setAsk("engineer");
              setSent("idle");
            }}
          >
            Talk to an engineer
          </button>
          <button
            className="q-btn ghost"
            type="button"
            onClick={() => {
              setAsk("save");
              setSent("idle");
            }}
          >
            Save for later
          </button>
        </div>
        {ask && sent !== "sent" && (
          <form className="q-ask no-print" onSubmit={send}>
            <p className="micro" style={{ textAlign: "left" }}>
              {ask === "survey" && "This requests a survey. A time is not booked until we confirm."}
              {ask === "certify" &&
                "Attach the bill if you have it. The quote stays on this page either way."}
              {ask === "engineer" && "An engineer replies from sales@merlinenergy.net."}
              {ask === "save" && "We'll email you this quote. It is already on the screen."}
            </p>
            {ask === "certify" && onBill && (
              <label className="q-file">
                Bill PDF
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onBill(file);
                  }}
                />
              </label>
            )}
            <input
              required
              placeholder="Name"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hp"
              value={contact.company_website_url}
              onChange={(e) => setContact({ ...contact, company_website_url: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <label className="trust">
              <input
                type="checkbox"
                checked={contact.consent}
                onChange={(e) => setContact({ ...contact, consent: e.target.checked })}
              />
              Merlin can contact me about this quote.
            </label>
            {error && <p className="form-error">{error}</p>}
            <button
              className="q-btn primary"
              type="submit"
              disabled={!contact.consent || sent === "sending"}
            >
              {sent === "sending" ? "Sending…" : "Send"}
            </button>
          </form>
        )}
        {sent === "sent" && (
          <p className="q-done no-print">Received. Reply will come from sales@merlinenergy.net.</p>
        )}
      </div>

      <div className="assume">
        <b>Assumptions</b>
        <p>
          {quote.meta?.bessMethod ? `${quote.meta.bessMethod}. ` : ""}
          {quote.meta?.pricingSource ? `Pricing: ${quote.meta.pricingSource}. ` : ""}
          Solar resource is {quote.solar.peakSunHours} peak sun hours ({quote.solar.source}).{" "}
          {quote.meta?.itcNote
            ? `${quote.meta.itcNote} `
            : "The 30% ITC is applied to solar and standalone storage. Consult your tax adviser on eligibility. "}
          {quote.monteCarlo.note}. No state or utility incentive is included until it is confirmed
          for this site. This quote is not a contract and is not an offer of financing.
        </p>
      </div>
    </div>
  );
}
