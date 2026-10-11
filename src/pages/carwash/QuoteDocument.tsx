import { useState, type FormEvent } from "react";
import { ORCHESTRATION_FEE } from "../../../pricing/orchestrationFee";
import { CONED_UNCERTIFIED_DEMAND_PER_KW } from "./quoteApi";
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

function rateDollars(value: number) {
  return value % 1 === 0 ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`;
}

function kwLabel(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function warrantyPhrase(years: number[]) {
  const labels = years.map((year) => `a ${year}-year`);
  if (labels.length <= 1) return labels[0] ?? "the";
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

function WarrantyLines({
  terms,
}: {
  terms: { years: number; netBack: number; paidOff: boolean }[];
}) {
  if (!terms.length) return null;
  return (
    <ul className="warranties">
      {terms.map((term) => (
        <li key={term.years}>
          <span className="yr">{term.years}-year warranty</span>
          <span className={`amt${term.netBack < 0 ? " short" : ""}`}>
            {term.netBack < 0 ? `−${money(Math.abs(term.netBack))}` : money(term.netBack)}
          </span>
          <span className={`tag${term.paidOff ? "" : " short"}`}>
            {term.paidOff ? "Paid off" : "Still short"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function statusWord(status: QuoteRequestContext["peakStatus"]) {
  if (status === "certified" || status === "entered")
    return status === "certified" ? "Confirmed" : "You entered this";
  if (status === "provisional") return "Estimated";
  return "Estimated";
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
  const [ask, setAsk] = useState<null | "install" | "survey" | "certify" | "save" | "solar">(null);
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
    ? "Confirmed quote"
    : provisional
      ? "Provisional quote"
      : "Estimated quote";
  const vendor = [quote.equipmentSelection?.bess?.vendor, quote.equipmentSelection?.bess?.model]
    .filter(Boolean)
    .join(" ");
  const solar = tier.equipment.solarKW > 0;
  const title = `${place} — what storage would do for you`;
  const softCosts =
    tier.costs.siteEngineering +
    tier.costs.constructionContingency +
    tier.costs.merlinFees.totalFee;
  const marginPct = Math.round(tier.costs.merlinFees.effectiveMargin * 100);
  const feeFact =
    ORCHESTRATION_FEE.kind === "marginal"
      ? `${money(tier.costs.merlinFees.totalFee)} — ${marginPct}% blended`
      : ORCHESTRATION_FEE.kind === "flat"
        ? money(tier.costs.merlinFees.totalFee)
        : `${marginPct}%`;
  const rateConfirmed = context.rateStatus === "certified" || context.rateStatus === "estimated";
  const sunFallback = quote.solar.peakSunHours === 4.5;
  const batteryVerified = quote.provenance.bess?.tag === "verified";
  const recommend = tier.roi.paysBackInLife === true;
  const terms = tier.roi.warrantyTerms ?? [];
  const missedYears = terms.filter((term) => !term.paidOff).map((term) => term.years);
  const clearedYears = terms.filter((term) => term.paidOff).map((term) => term.years);
  const utilityShort = utilityName.split("/")[0].trim();
  const reserveBill = Math.round(peak * rate * 12);
  const brooklynBill = Math.round(peak * CONED_UNCERTIFIED_DEMAND_PER_KW * 12);
  const compareBrooklyn =
    rate < CONED_UNCERTIFIED_DEMAND_PER_KW && !/con edison/i.test(utilityName);
  const creditedKw = tier.savings.creditedShaveKW ?? tier.equipment.bessKW;
  const shavePct = Math.round((tier.savings.shaveEffectiveness ?? 0.95) * 100);
  const effectiveKw =
    tier.savings.effectiveShaveKW ?? creditedKw * (tier.savings.shaveEffectiveness ?? 0.95);
  // Same effectiveness the engine used. The Con Edison figure is what this
  // battery would earn on demand, not the whole capacity bill.
  const demandAtConEd = Math.round(effectiveKw * CONED_UNCERTIFIED_DEMAND_PER_KW * 12);

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

  const costRows: { label: string; amount: number }[] = [
    ...(tier.costs.solarCost > 0
      ? [{ label: `Solar — ${tier.equipment.solarKW} kW`, amount: tier.costs.solarCost }]
      : []),
    {
      label: `Battery — ${tier.equipment.bessKW} kW / ${tier.equipment.bessKWh} kWh`,
      amount: tier.costs.bessCost,
    },
    ...(tier.costs.generatorCost > 0
      ? [
          {
            label: `Generator — ${tier.equipment.generatorKW} kW`,
            amount: tier.costs.generatorCost,
          },
        ]
      : []),
    {
      label: `Site work, engineering, contingency and our fee (${feeFact})`,
      amount: softCosts,
    },
  ];

  function leadFields() {
    if (sent === "sent") {
      return (
        <p className="q-done no-print">Received. Reply will come from sales@merlinenergy.net.</p>
      );
    }
    if (!ask) return null;
    return (
      <form className="q-ask no-print" onSubmit={send}>
        <p className="micro" style={{ textAlign: "left" }}>
          {ask === "install" && "This asks us to install it. Nothing is booked until we confirm."}
          {ask === "survey" && "This asks for a site visit. A time is not booked until we confirm."}
          {ask === "certify" &&
            "Attach the bill if you have it. The quote stays on this page either way."}
          {ask === "save" && "We'll email you this quote. It is already on the screen."}
          {ask === "solar" &&
            "This asks us to price the canopy without the battery. Nothing is booked until we confirm."}
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
    );
  }

  return (
    <div className="quote-doc" id="quote-doc">
      <span className={`badge ${certifiedQuote ? "" : "est"}`}>
        {certifiedQuote ? "✓ " : ""}
        {badge}
      </span>
      <h1>{title}</h1>
      <p className="sub">
        <b>{washLabel}</b>
        {cars ? <> · ~{cars} cars/day</> : null} · <span className="num">{peak} kW peak</span> ·{" "}
        <b>{utilityName}</b> · {rateSchedule}
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

      {!recommend && (
        <div className="verdict">
          <h2>We don't recommend storage at this address</h2>
          <p>
            At {utilityShort}'s <b>{rateDollars(rate)} per kW</b> demand charge, the same system
            saves about <b>{money(tier.roi.monthlySavings)} a month</b> here. It costs{" "}
            <b>{money(tier.costs.netInvestment)}</b>, so it wouldn't pay for itself inside{" "}
            {warrantyPhrase(missedYears)} battery warranty.
            {clearedYears.length > 0 && (
              <>
                {" "}
                The {clearedYears.join("- and ")}-year warranty finishes ahead, and that is not
                enough to recommend storage.
              </>
            )}
          </p>
          <div className="facts">
            <div>
              <div className="k">Saves you</div>
              <div className="v num">
                {money(tier.roi.monthlySavings)} <small>/ month</small>
              </div>
            </div>
            <div>
              <div className="k">System cost</div>
              <div className="v num">{money(tier.costs.netInvestment)}</div>
            </div>
            <div>
              <div className="k">Pays back in</div>
              <div className="v down num">
                {tier.roi.paybackYears >= 100 ? (
                  "—"
                ) : (
                  <>
                    {tier.roi.paybackYears} <small>years</small>
                  </>
                )}
              </div>
            </div>
          </div>
          <WarrantyLines terms={terms} />
          {compareBrooklyn ? (
            <>
              <p>
                <b>Same equipment, same price, one different number.</b> Your {peak} kW peak costs{" "}
                {money(reserveBill)} a year to reserve at {rateDollars(rate)}/kW. The identical peak
                on Con Edison costs {money(brooklynBill)}. That gap is the entire difference between
                this quote and the Brooklyn one.
              </p>
              <p>
                The battery shaves {creditedKw} kW of that peak, so it earns{" "}
                {money(tier.savings.demandChargeSavings)} a year here against {money(demandAtConEd)}{" "}
                there.
                {solar && (
                  <>
                    {" "}
                    Solar is {money(tier.savings.solarSavings)} either way — it follows the energy
                    price and the sun, not the demand charge.
                  </>
                )}{" "}
                Every dollar of the system price is the same.
              </p>
            </>
          ) : (
            <p>
              <b>Demand charge is the whole story.</b> At {rateDollars(rate)}/kW you're paying{" "}
              {money(reserveBill)} a year to reserve capacity.
            </p>
          )}
          <h3>What would change the answer</h3>
          <ul>
            <li>
              <b>A different rate schedule.</b> Check the demand line on your bill — if you're
              billed on a rider or a time-of-use rate with a real demand component, this changes.
            </li>
            {solar && (
              <li>
                <b>Solar without storage.</b> Cheaper, and it works on your energy price rather than
                your demand charge. That part still pencils here.
              </li>
            )}
            <li>
              <b>Demand response or backup.</b> If you have outages to protect against, a generator
              earns its place for a different reason — but we'd price that on its own terms, not
              folded into an energy-savings payback it can't produce.
            </li>
          </ul>
        </div>
      )}

      <div className="q-grid">
        <div>
          <div className="q-card">
            <h2 className="hd">What we'd put in</h2>
            <div className="bd">
              <div className="sysname num">
                {tier.equipment.bessKW} kW / {tier.equipment.bessKWh} kWh battery
              </div>
              <p className="sysmeta">
                {tier.equipment.durationHrs}-hour storage · behind your meter · no export
              </p>
              <ul className="spec">
                <li>
                  <span>Battery unit</span>
                  <span>{vendor || "Selected for this size"}</span>
                </li>
                {solar && (
                  <li>
                    <span>Solar canopy</span>
                    <span className="num">{tier.equipment.solarKW} kW</span>
                  </li>
                )}
                <li>
                  <span>Storage</span>
                  <span className="num">
                    {tier.equipment.bessKW} kW · {tier.equipment.bessKWh} kWh ·{" "}
                    {tier.equipment.durationHrs} hours
                  </span>
                </li>
                <li>
                  <span>Generator</span>
                  <span>
                    {tier.equipment.generatorKW > 0
                      ? `${tier.equipment.generatorKW} kW — backup, not in the payback`
                      : "Not needed"}
                  </span>
                </li>
                <li>
                  <span>Export to grid</span>
                  <span>None — no utility study required</span>
                </li>
                <li>
                  <span>Purpose</span>
                  <span>Shave your monthly demand peak</span>
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
                      Lower demand charge{" "}
                      <span>
                        ({tier.savings.creditedShaveKW ?? tier.equipment.bessKW} kW shaved)
                      </span>
                    </td>
                    <td className="num">{money(tier.savings.demandChargeSavings)}</td>
                  </tr>
                  {tier.savings.solarSavings > 0 && (
                    <tr>
                      <td>Solar generation ({tier.equipment.solarKW} kW canopy)</td>
                      <td className="num">{money(tier.savings.solarSavings)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Less service &amp; reserves</td>
                    <td className="num neg">−{money(tier.savings.annualReserves)}</td>
                  </tr>
                  <tr className="rule total">
                    <td>Kept every year</td>
                    <td className="num">{money(tier.savings.netAnnualSavings)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="micro num">
                {recommend ? (
                  <>
                    That's <b>{money(tier.roi.monthlySavings)} a month</b> back in the business.
                  </>
                ) : (
                  <>
                    That's <b>{money(tier.roi.monthlySavings)} a month</b> — against a{" "}
                    {money(tier.costs.netInvestment)} system.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="q-card">
            <h2 className="hd">{recommend ? "What it costs" : "What it would cost"}</h2>
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
                    <td>Total investment</td>
                    <td className="num">{money(tier.costs.totalInvestment)}</td>
                  </tr>
                  <tr>
                    <td>Federal tax credit (30%)</td>
                    <td className="num neg">−{money(tier.costs.federalITC)}</td>
                  </tr>
                  <tr className="rule total">
                    <td>{recommend ? "Your net cost" : "Net cost"}</td>
                    <td className="num">{money(tier.costs.netInvestment)}</td>
                  </tr>
                  {tier.costs.complianceCapital.investment > 0 && (
                    <tr>
                      <td>Of which the generator is compliance capital, not in the payback</td>
                      <td className="num">{money(tier.costs.complianceCapital.investment)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="micro">
                {recommend
                  ? "Our fee is inside that total, not added later."
                  : "We'd rather show you this than a payback you'd never reach."}
                {recommend && tier.costs.complianceCapital.investment > 0 && tier.blendedRoi && (
                  <>
                    {" "}
                    Payback below is on the battery and solar. All-in, including the generator, is{" "}
                    {tier.blendedRoi.paybackYears} years.
                  </>
                )}
              </p>
              {recommend && (
                <>
                  <div className="returns">
                    <div>
                      <div className="k">Back each month</div>
                      <div className="v num">{money(tier.roi.monthlySavings)}</div>
                    </div>
                    <div>
                      <div className="k">Paid off in</div>
                      <div className="v num">
                        {tier.roi.paybackYears >= 100 ? (
                          "—"
                        ) : tier.roi.paybackYears === 0 ? (
                          "Already"
                        ) : (
                          <>
                            {tier.roi.paybackYears} <small>years</small>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <WarrantyLines terms={terms} />
                </>
              )}
            </div>
          </div>

          <div className="q-ctas no-print">
            {recommend ? (
              <button
                className="q-btn primary"
                type="button"
                onClick={() => {
                  setAsk("install");
                  setSent("idle");
                }}
              >
                Get this installed →
              </button>
            ) : null}
            <button
              className="q-btn ghost"
              type="button"
              onClick={() => {
                setAsk("certify");
                setSent("idle");
              }}
            >
              {recommend ? "Send my bill — make it exact" : "Send my bill — check my rate"}
            </button>
            {!recommend && solar && (
              <button
                className="q-btn ghost"
                type="button"
                onClick={() => {
                  setAsk("solar");
                  setSent("idle");
                }}
              >
                Price solar on its own
              </button>
            )}
            <button className="q-btn ghost" type="button" onClick={() => window.print()}>
              Print / save as PDF
            </button>
            <p className="microc">
              {recommend
                ? "Nothing is booked yet. Look it over first."
                : "No install button, because we're not recommending this one."}
            </p>
            {!recommend && leadFields()}
          </div>
        </div>
      </div>

      <div className="q-card prov">
        <h2 className="hd">Where every number comes from</h2>
        <div className="bd">
          <table className="prov">
            <tbody>
              <tr>
                <td className={rateConfirmed ? "cert" : "est"}>
                  <span className="glyph">{rateConfirmed ? "✓" : "◐"}</span>
                  Demand charge — ${rate.toFixed(2)}/kW-month
                </td>
                <td className="src">{context.rateSourceText}</td>
                <td className={rateConfirmed ? "st cert" : "st est"}>
                  {rateConfirmed ? "Confirmed" : "Estimated"}
                </td>
              </tr>
              <tr>
                <td className="cert">
                  <span className="glyph">✓</span>Federal tax credit — 30%
                </td>
                <td className="src">Inflation Reduction Act §48</td>
                <td className="st cert">Confirmed</td>
              </tr>
              <tr>
                <td className={context.peakStatus === "certified" ? "cert" : "est"}>
                  <span className="glyph">{context.peakStatus === "certified" ? "✓" : "◐"}</span>
                  Your peak demand — {peak} kW
                </td>
                <td className="src">{context.peakSourceText}</td>
                <td className={context.peakStatus === "certified" ? "st cert" : "st est"}>
                  {statusWord(context.peakStatus)}
                </td>
              </tr>
              <tr>
                <td className="est">
                  <span className="glyph">◐</span>
                  Demand shaved — {tier.savings.creditedShaveKW ?? tier.equipment.bessKW} kW
                </td>
                <td className="src">
                  {tier.savings.shaveCapped
                    ? `Credited shave capped at 45% of peak (${tier.savings.creditedShaveKW} of ${tier.equipment.bessKW} kW)`
                    : "Sized to your peak; credited shave capped at 45%"}
                </td>
                <td className="st est">Estimated</td>
              </tr>
              <tr>
                <td className={batteryVerified ? "cert" : "est"}>
                  <span className="glyph">{batteryVerified ? "✓" : "◐"}</span>
                  Battery price
                </td>
                <td className="src">{quote.provenance.bess?.source}</td>
                <td className={batteryVerified ? "st cert" : "st est"}>
                  {batteryVerified ? "Confirmed" : "Estimated"}
                </td>
              </tr>
              <tr>
                <td className={sunFallback ? "est" : "cert"}>
                  <span className="glyph">{sunFallback ? "◐" : "✓"}</span>
                  Sun hours — {quote.solar.peakSunHours} h/day
                </td>
                <td className="src">
                  {sunFallback ? "US average; site data unavailable" : quote.solar.source}
                </td>
                <td className={sunFallback ? "st est" : "st cert"}>
                  {sunFallback ? "Estimated" : "Confirmed"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {recommend && (
        <div className="q-next">
          <h3>Two ways to take this further</h3>
          <p>
            This quote is yours. It doesn't expire and it doesn't need a call. If you want it exact,
            there are two things you can do — your choice:
          </p>
          <ol>
            <li>
              <b>Send us your bill.</b> The estimated lines above become confirmed, and we re-price
              it, usually the same day.
            </li>
            <li>
              <b>Have us come look.</b> We check the switchgear, the interconnect point and the pad,
              then lock the number.
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
              Send my bill
            </button>
            <button
              className="q-btn ghost"
              type="button"
              onClick={() => {
                setAsk("survey");
                setSent("idle");
              }}
            >
              Book a site visit
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
          {leadFields()}
        </div>
      )}

      <div className="assume">
        <b>The fine print</b>
        <p>
          {context.peakStatus === "certified"
            ? "Peak demand was read from your bill. "
            : `Peak demand of ${peak} kW is ${context.peakSourceText.toLowerCase()}. `}
          Open {days} days a week. Demand savings credit {creditedKw} kW of nameplate, realized at{" "}
          {shavePct}% ({kwLabel(effectiveKw)} kW), and never more than 45% of site peak.
          {solar
            ? ` Solar is ${tier.equipment.solarKW} kW at ${quote.solar.peakSunHours} sun hours a day.`
            : ""}{" "}
          Battery source: {quote.provenance.bess?.source}. Our fee is {feeFact}
          {ORCHESTRATION_FEE.kind === "tiered" ? " of equipment" : ""}, and is inside the total
          above.{" "}
          {recommend ? (
            <>
              Cash is shown at the end of a 5-year, a 10-year, and a 20-year battery warranty. Each
              line stops at that warranty. We do not model a replacement, and we do not carry
              savings past the term.
            </>
          ) : clearedYears.includes(20) ? (
            <>
              Payback
              {tier.roi.paybackYears < 100 ? ` of ${tier.roi.paybackYears} years` : ""} misses a
              5-year and a 10-year battery warranty, which is why we are not recommending storage
              here. The 20-year line is the cash position if the battery is warranted that long.
            </>
          ) : (
            <>
              Payback
              {tier.roi.paybackYears < 100 ? ` of ${tier.roi.paybackYears} years` : ""} exceeds a
              20-year battery warranty, the longest term we price, which is why we are not
              recommending storage here.
            </>
          )}{" "}
          The 30% federal credit is a direct reduction in cost — check eligibility with your
          accountant. No state or utility incentive is included until it is confirmed for this site.
          This is not a contract and not an offer of financing.
        </p>
      </div>
    </div>
  );
}
