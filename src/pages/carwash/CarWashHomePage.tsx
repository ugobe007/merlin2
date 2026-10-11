import { useEffect, useMemo, useState, type FormEvent } from "react";
import LOOKUP from "@/data/utility_zip_lookup.json";
import {
  resolveUtility,
  type PublicRegion,
  type UtilityLookup,
} from "@/services/carwashUtilityResolve.js";
import { CONED_UNCERTIFIED_DEMAND_PER_KW } from "./quoteApi";
import { setPendingBill } from "./model";
import { MonthChart } from "./MonthChart";
import "./carwash.css";
import "./home.css";

const BRANDS: { label: string; pattern: RegExp | null }[] = [
  { label: "Independent — single site", pattern: null },
  { label: "Mister Car Wash", pattern: /mister/i },
  { label: "Zips Car Wash", pattern: /\bzips?\b/i },
  { label: "Tommy's Express", pattern: /tommy/i },
  { label: "Whistle Express", pattern: /whistle/i },
  { label: "Take 5 Car Wash", pattern: /take\s*5/i },
  { label: "Splash Car Wash", pattern: /\bsplash\b/i },
  { label: "Other chain", pattern: null },
];

type Prediction = {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText: string;
};

type ChosenPlace = { placeId: string; name: string; address: string };

function inferBrand(name: string) {
  return BRANDS.find((brand) => brand.pattern?.test(name))?.label ?? "Independent — single site";
}

function quotedRate(region: PublicRegion): number | null {
  const low = region.demandCharge?.low;
  const high = region.demandCharge?.high;
  if (low == null || high == null) return null;
  if (region.utilityId === "coned") return CONED_UNCERTIFIED_DEMAND_PER_KW;
  return Math.round(((low + high) / 2) * 100) / 100;
}

function rateText(rate: number) {
  return `$${rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kW-mo`;
}

function territoryPhrase(verdict: string) {
  return verdict === "weak" ? "low demand-charge territory" : "commercial demand territory";
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function Photo({ name, alt }: { name: string; alt: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <picture>
      <source srcSet={`/carwash/${name}.webp`} type="image/webp" />
      <img src={`/carwash/${name}.jpg`} alt={alt} onError={() => setShow(false)} />
    </picture>
  );
}

function SitePhoto({ name, alt }: { name: string; alt: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="art">
      <picture>
        <source srcSet={`/carwash/${name}.webp`} type="image/webp" />
        <img src={`/carwash/${name}.jpg`} alt={alt} onError={() => setShow(false)} />
      </picture>
    </div>
  );
}

export default function CarWashHomePage() {
  const [zip, setZip] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [business, setBusiness] = useState("");
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<ChosenPlace | null>(null);
  const [placesNote, setPlacesNote] = useState<string | null>(null);
  const [brand, setBrand] = useState(BRANDS[0].label);
  const [inferred, setInferred] = useState<string | null>(null);
  const [spend, setSpend] = useState("");
  const [billName, setBillName] = useState<string | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resolution = useMemo(() => {
    if (!/^\d{5}$/.test(zip)) return null;
    return resolveUtility(zip, LOOKUP as UtilityLookup);
  }, [zip]);

  const shown =
    (pickedId && resolution?.candidates.find((candidate) => candidate.utilityId === pickedId)) ||
    (resolution?.resolved ? resolution.region : null);
  const rate = shown ? quotedRate(shown) : null;

  useEffect(() => {
    if (business.trim().length < 2 || !/^\d{5}$/.test(zip) || (place && place.name === business)) {
      setSuggestions([]);
      if (business.trim().length < 2) setPlacesNote(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            input: business.trim(),
            types: "establishment",
            postalCode: zip,
            country: "us",
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setSuggestions([]);
          setPlacesNote("Places is unavailable. The name you type is enough.");
          return;
        }
        const next = (payload.predictions || []) as Prediction[];
        setSuggestions(next);
        setSuggestOpen(true);
        setActive(0);
        setPlacesNote(
          next.length ? null : "No matches in this ZIP. You can still continue with the name."
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSuggestions([]);
        setPlacesNote("Places is unavailable. The name you type is enough.");
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [business, zip, place]);

  async function choosePlace(prediction: Prediction) {
    setSuggestOpen(false);
    setSuggestions([]);
    setPlacesNote(null);
    let name = prediction.primaryText;
    let address = prediction.secondaryText || prediction.label;
    try {
      const response = await fetch("/api/places/place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: prediction.placeId }),
      });
      if (response.ok) {
        const detail = await response.json();
        if (detail.name) name = detail.name;
        if (detail.formattedAddress) address = detail.formattedAddress;
      }
    } catch {
      /* the prediction address is enough to continue */
    }
    const nextBrand = inferBrand(name);
    setBusiness(name);
    setInferred(nextBrand);
    setBrand(nextBrand);
    setPlace({ placeId: prediction.placeId, name, address });
  }

  function onBrand(next: string) {
    setBrand(next);
    if (inferred && next !== inferred && place) {
      console.info("[merlin] Places name and chosen brand disagree", {
        place: place.name,
        placeId: place.placeId,
        inferred,
        chosen: next,
      });
    }
  }

  function start(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setFormError("Enter a 5-digit ZIP.");
      return;
    }
    if (!business.trim()) {
      setFormError("Name the car wash.");
      return;
    }
    setFormError(null);
    setPendingBill(billFile);
    const params = new URLSearchParams();
    params.set("address", place?.address || `${business.trim()}, ${zip}`);
    params.set("zip", zip);
    params.set("industry", "car-wash");
    params.set("brand", brand);
    params.set("bill_attached", billFile ? "true" : "false");
    if (place?.placeId) params.set("place_id", place.placeId);
    if (spend.trim()) params.set("spend", spend.trim());
    if (shown?.utilityId) params.set("utility", shown.utilityId);
    if (inferred && brand !== inferred) params.set("brand_mismatch", "1");
    window.location.href = `/diagnostic?${params.toString()}`;
  }

  return (
    <div className="merlin-cw home">
      <nav>
        <div className="wrap">
          <a className="brand" href="/">
            <i />
            Merlin Energy
          </a>
          <div className="links">
            <a href="#how">How it works</a>
            <a href="#economy">Where it works</a>
            <a href="#paths">What we install</a>
            <a href="#faq">Questions</a>
            <a href="/how-we-get-paid">How we get paid</a>
          </div>
          <div className="end">
            <a className="nbtn" href="#start">
              Price my peak →
            </a>
          </div>
        </div>
      </nav>

      <header className="hero" id="start">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="wrap">
          <div className="inner">
            <span className="pill">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 17h18M6 17V9l4-3h4l4 3v8" />
                <circle cx="8.5" cy="13" r="1.6" />
                <circle cx="15.5" cy="13" r="1.6" />
              </svg>
              Built for express tunnel washes
            </span>
            <h1>
              One busy Saturday sets your power bill for <em>the whole month</em>.
            </h1>
            <p className="lede">
              Your utility doesn't bill what you use. It bills the <b>single highest 15 minutes</b>{" "}
              of the month — and on a tunnel wash that's the blowers and the pumps landing together.
              Put in your ZIP and we'll price what it costs to clip.
            </p>
            <div className="ctas">
              <a className="btn primary" href="#zip">
                Start with your ZIP →
              </a>
              <a className="btn ghost" href="#how">
                How it works
              </a>
            </div>
            <p className="trust">
              <Check /> We're paid by you — never a commission from the installers we recommend.
            </p>
          </div>

          <form className="card" onSubmit={start}>
            <h3>Price my peak</h3>
            <p className="sub">Two minutes. No engineering fee. No sales call.</p>

            <div className="fstep">
              <label htmlFor="zip">
                <span className="ord">1</span>Your ZIP code
              </label>
              <div className="ziprow">
                <input
                  id="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  aria-label="ZIP code"
                  placeholder="11214"
                  value={zip}
                  onChange={(event) => {
                    setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
                    setPickedId(null);
                  }}
                />
              </div>
              {shown && (
                <div className="resolved">
                  <Check />
                  <span>
                    <b>{shown.shortName}</b> — {territoryPhrase(shown.verdict)}
                  </span>
                  {rate != null && <span className="rt">{rateText(rate)}</span>}
                </div>
              )}
              {resolution?.confidence === "medium" && (
                <p className="confirm">{resolution.message}</p>
              )}
              {resolution && !shown && <p className="confirm">{resolution.message}</p>}
              {pickedId && resolution?.confidence === "ambiguous" && (
                <p className="confirm">
                  You named this utility. The ZIP alone was split between more than one.
                </p>
              )}
              {resolution?.confidence === "ambiguous" && !pickedId && (
                <div className="cands">
                  {resolution.candidates.map((candidate) => (
                    <button
                      key={candidate.utilityId}
                      type="button"
                      onClick={() => setPickedId(candidate.utilityId)}
                    >
                      {candidate.shortName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="fstep">
              <label htmlFor="wash">
                <span className="ord">2</span>Your car wash
              </label>
              <div className="pi">
                <input
                  id="wash"
                  value={business}
                  aria-label="Business name"
                  autoComplete="off"
                  placeholder="Start typing the wash name"
                  onChange={(event) => {
                    setBusiness(event.target.value);
                    setPlace(null);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => suggestions.length && setSuggestOpen(true)}
                  onKeyDown={(event) => {
                    if (!suggestOpen || !suggestions.length) return;
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActive((index) => Math.min(index + 1, suggestions.length - 1));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActive((index) => Math.max(index - 1, 0));
                    } else if (event.key === "Enter" && suggestions[active]) {
                      event.preventDefault();
                      void choosePlace(suggestions[active]);
                    } else if (event.key === "Escape") {
                      setSuggestOpen(false);
                    }
                  }}
                />
                <span className="powered">Google Places</span>
              </div>
              {suggestOpen && suggestions.length > 0 && (
                <div className="suggest" role="listbox">
                  {suggestions.map((item, index) => (
                    <button
                      key={item.placeId}
                      type="button"
                      role="option"
                      className={index === active ? "on" : undefined}
                      aria-selected={index === active}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => void choosePlace(item)}
                    >
                      <PinIcon />
                      <div>
                        <b>{item.primaryText}</b>
                        <span>{item.secondaryText}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {placesNote && !suggestions.length && <p className="confirm">{placesNote}</p>}
            </div>

            <div className="fstep">
              <label htmlFor="brand">
                <span className="ord">3</span>Brand
              </label>
              <div className="selwrap">
                <select
                  id="brand"
                  aria-label="Car wash brand"
                  value={brand}
                  onChange={(event) => onBrand(event.target.value)}
                >
                  {BRANDS.map((item) => (
                    <option key={item.label}>{item.label}</option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="fstep">
              <label htmlFor="spend">
                Monthly electric spend <span className="optlab">optional</span>
              </label>
              <input
                id="spend"
                value={spend}
                inputMode="decimal"
                aria-label="Monthly electric spend"
                placeholder="$18,000 — sharpens the estimate"
                onChange={(event) => setSpend(event.target.value)}
              />
            </div>

            <label className="optrow">
              <span className="ic">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              </span>
              <div>
                <b>{billName ? billName : "Add a bill — it stays optional"}</b>
                <span>Skip it and you still get a full quote, marked estimated.</span>
              </div>
              <span className="pill2">optional</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setBillFile(file);
                  setBillName(file?.name ?? null);
                }}
              />
            </label>

            {formError && <p className="form-error">{formError}</p>}
            <button className="btn primary go" type="submit">
              See what's recoverable
            </button>
            <p className="fine">
              Your ZIP sets the utility and the rate. A bill is what makes the peak <b>certified</b>{" "}
              — and only the lines we actually read off it. We never sell your data.
            </p>
          </form>
        </div>
      </header>

      <div className="ribbon">
        <div className="wrap">
          <div className="shot">
            <Photo
              name="hero_tunnel"
              alt="An express tunnel car wash at dusk with cars on the conveyor"
            />
            <div className="cap">
              <b>The blowers are the spike. The conveyors and pumps are the floor.</b>
              <span>400–800 kW burst load · 30–50% of the bill is demand, not energy</span>
            </div>
          </div>
        </div>
      </div>

      <section className="insight">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">The part nobody shows you</span>
            <h2>
              The dryers fire for forty seconds. <em>You're billed for it all month.</em>
            </h2>
            <p className="lede">
              A demand charge is set by your worst quarter-hour in the billing month, and it's
              billed on every kW of that peak. Run blowers, pumps and the RO together once on a busy
              Saturday and that number is yours for the next 30 days — even on the quiet days that
              follow.
            </p>
          </div>
          <div className="chartbox">
            <div className="cap">
              <div>
                <h3>One billing month at a 400 kW tunnel wash</h3>
                <p>All 2,880 fifteen-minute intervals, drawn to scale.</p>
              </div>
              <div className="legend">
                <span className="lg-load">
                  <i />
                  Your load, every 15 minutes
                </span>
                <span className="lg-bill">
                  <i />
                  The interval that sets the bill
                </span>
              </div>
            </div>
            <MonthChart />
            <div className="chartnote">
              <span className="amt">
                $14,328<span style={{ fontSize: 13 }}>/mo</span>
              </span>
              <p>
                398 kW × <b>$36/kW-month</b> on Con Edison's commercial demand rate — and that one
                Saturday morning is the line item that repeats every month. You are billed on the{" "}
                <b>top of the range, never the middle</b>, which is why the average line matters so
                much less than the peak.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="grid">
            <div>
              <div className="rule" />
              <div className="v">
                400–800<small> kW</small>
              </div>
              <div className="k">
                <b>burst load</b> drawn by an express tunnel wash when blowers, pumps and RO run
                together
              </div>
            </div>
            <div>
              <div className="rule" />
              <div className="v">
                30–50<small>%</small>
              </div>
              <div className="k">
                of a car wash electric bill is <b>demand, not energy</b> — the part nobody quotes
                you
              </div>
            </div>
            <div>
              <div className="rule" />
              <div className="v">
                $33.50<small>–$42.80</small>
              </div>
              <div className="k">
                per kW-month on Con Edison commercial rates. <b>Every kW of peak, every month.</b>
              </div>
            </div>
            <div>
              <div className="rule" />
              <div className="v">
                ~5<small>×</small>
              </div>
              <div className="k">
                SDE multiple. <b>Every $1 of annual savings is ~$5 of enterprise value</b> when you
                sell
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="pad"
        style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}
      >
        <div className="wrap">
          <div className="split flip">
            <SitePhoto
              name="battery_site"
              alt="A commercial battery enclosure installed beside a car wash equipment room"
            />
            <div>
              <span className="eyebrow">What we'd actually install</span>
              <h2>A battery behind your meter, sized to one thing: your peak.</h2>
              <p className="lede">
                Not a solar pitch. A battery that watches your load and discharges for the few
                minutes a month when the tunnel spikes — so the interval the utility records is
                never the one that costs you.
              </p>
              <div className="tick">
                <div>
                  <Check />
                  <span>
                    <b>Sized to your peak, not your floor.</b> We size to the interval the bill is
                    actually built on.
                  </span>
                </div>
                <div>
                  <Check />
                  <span>
                    <b>No export, no interconnection study.</b> Behind the meter only — nothing for
                    the utility to approve.
                  </span>
                </div>
                <div>
                  <Check />
                  <span>
                    <b>Your tunnel keeps running.</b> Installed on a pad beside the equipment room;
                    no wash downtime.
                  </span>
                </div>
                <div>
                  <Check />
                  <span>
                    <b>A 30% federal credit</b> applies to the storage. Your accountant confirms
                    eligibility.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" id="economy">
        <div className="wrap">
          <span className="eyebrow">Why we ask for your address first</span>
          <h2 style={{ fontSize: 40, marginTop: 12, maxWidth: "22ch" }}>
            The same wash is a great project in Brooklyn and a bad one in Houston.
          </h2>
          <p className="lede" style={{ fontSize: 17, marginTop: 18, maxWidth: "74ch" }}>
            Demand charges are set by your utility, and they are not close. We'd rather tell you it
            doesn't work than sell you a battery that can't pay for itself.
          </p>
          <div className="verdicts">
            <div className="vc win">
              <span className="tag">Strong economics</span>
              <h3>Storage pays for itself</h3>
              <div className="city">Brooklyn · Con Edison · 350 kW peak</div>
              <div className="row">
                <span>Demand charge</span>
                <b>$36.00 / kW-month</b>
              </div>
              <div className="row">
                <span>Recoverable each year</span>
                <b>$57,456</b>
              </div>
              <div className="row">
                <span>Paid off in</span>
                <b>3.5 years</b>
              </div>
              <div className="row">
                <span>5-year warranty</span>
                <b>Paid off</b>
              </div>
              <div className="row">
                <span>10-year warranty</span>
                <b>Paid off</b>
              </div>
              <div className="row">
                <span>20-year warranty</span>
                <b>Paid off</b>
              </div>
              <p>
                The peak is expensive enough that clipping it pays back inside a 5-year battery
                warranty.
              </p>
            </div>
            <div className="vc lose">
              <span className="tag">Honest verdict</span>
              <h3>We don't recommend storage here</h3>
              <div className="city">Houston · CenterPoint · 350 kW peak</div>
              <div className="row">
                <span>Demand charge</span>
                <b>$5.00 / kW-month</b>
              </div>
              <div className="row">
                <span>Recoverable each year</span>
                <b>$7,980</b>
              </div>
              <div className="row">
                <span>Paid off in</span>
                <b>17.7 years</b>
              </div>
              <div className="row">
                <span>5-year warranty</span>
                <b style={{ color: "#8C4A16" }}>−$152,821</b>
              </div>
              <div className="row">
                <span>10-year warranty</span>
                <b style={{ color: "#8C4A16" }}>−$92,686</b>
              </div>
              <div className="row">
                <span>20-year warranty</span>
                <b>$27,584</b>
              </div>
              <p>
                It misses a 5-year and a 10-year warranty. A 20-year warranty finishes ahead, and
                that is not enough to recommend storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="pad"
        id="paths"
        style={{
          background: "#fff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="wrap">
          <span className="eyebrow">Three ways to capture it</span>
          <h2 style={{ fontSize: 40, marginTop: 12, maxWidth: "26ch" }}>
            We'll tell you which one actually fits — including when the answer is none.
          </h2>
          <div className="paths">
            <div className="path">
              <div className="pin">Fastest, cheapest</div>
              <h3>Rate &amp; bill audit</h3>
              <p>
                You may be on the wrong rate schedule entirely. We check the demand line, the riders
                and the meter reads, and file the correction.
              </p>
              <div className="who">
                <b>Best when:</b> your bill is misclassified or you're on an outdated schedule.
              </div>
            </div>
            <div className="path">
              <div className="pin">Most common</div>
              <h3>Battery storage</h3>
              <p>
                A battery behind the meter that clips the peak interval. No export, no utility
                study, no change to how the tunnel runs.
              </p>
              <div className="who">
                <b>Best when:</b> demand charges are above roughly $15/kW-month.
              </div>
            </div>
            <div className="path">
              <div className="pin">Revenue, not savings</div>
              <h3>Demand response</h3>
              <p>
                Get paid for curtailing during grid events. We enrol you and take a referral —
                rebatable if you'd rather pay it yourself.
              </p>
              <div className="who">
                <b>Best when:</b> you can shed load for a few hours a year.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2 style={{ fontSize: 40, marginTop: 12 }}>Three steps. No salesperson.</h2>
          <div className="steps">
            <div className="step">
              <div className="n">1</div>
              <h3>Give us the address, or the bill</h3>
              <p>
                An address gets you an estimate built from your utility's published rate. A bill is
                what makes the peak, the rate and the numbers below the fold certified.
              </p>
              <div className="t">≈ 2 minutes</div>
            </div>
            <div className="step">
              <div className="n">2</div>
              <h3>Get a priced quote, not a brochure</h3>
              <p>
                Sized equipment, real costs, payback, and the exact lines we read off your bill —
                with what's confirmed and what's still estimated, labelled.
              </p>
              <div className="t">≈ 15 minutes</div>
            </div>
            <div className="step">
              <div className="n">3</div>
              <h3>Decide, then we orchestrate</h3>
              <p>
                We run procurement, project management and the incentive filing. You never talk to a
                vendor unless you want to.
              </p>
              <div className="t">you choose</div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="pad"
        id="faq"
        style={{ background: "#fff", borderTop: "1px solid var(--line)" }}
      >
        <div className="wrap">
          <span className="eyebrow">The questions owners actually ask</span>
          <h2 style={{ fontSize: 40, marginTop: 12 }}>Straight answers.</h2>
          <div className="faq">
            <div className="qa">
              <h3>What does it cost?</h3>
              <p>
                One orchestration fee, set as a percentage of the equipment, and it's inside the
                number on the quote — never added later. Our{" "}
                <a href="/how-we-get-paid">how we get paid</a> page states the schedule in full.
              </p>
            </div>
            <div className="qa">
              <h3>Do I have to buy a battery?</h3>
              <p>
                No. If a rate or bill audit fixes it, that's what we'll tell you. If the demand
                charge is too low for storage to pay back, we'll say that too.
              </p>
            </div>
            <div className="qa">
              <h3>Is this just a solar company?</h3>
              <p>
                No. Solar saves you energy charges; a demand charge is a different line item. We
                size for the peak first, and we'll price a canopy separately if it earns its place.
              </p>
            </div>
            <div className="qa">
              <h3>How fast is "15 minutes"?</h3>
              <p>
                That's the quote from the details you've given us, on screen. If you want it
                certified, adding a bill usually re-prices it the same day.
              </p>
            </div>
            <div className="qa">
              <h3>What if I don't have the bill handy?</h3>
              <p>
                Give us the address. You'll get a real quote with an estimate badge on the lines we
                couldn't confirm, including the peak itself.
              </p>
            </div>
            <div className="qa">
              <h3>Will you sell my data?</h3>
              <p>No. It is used to price your project and to contact you about it. Nothing else.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap">
          <div className="in">
            <span className="eyebrow">Your ZIP. Two minutes.</span>
            <h2>
              Find out what your peak is <em>really costing you</em>.
            </h2>
            <p>
              The number is already on a bill you're paying. A ZIP prices it as an estimate. A bill
              is what makes the peak certified.
            </p>
            <div className="ctas">
              <a className="btn primary" href="#start">
                Start with your ZIP →
              </a>
              <a className="btn ghost" href="#how">
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>© Merlin Energy — demand-charge projects for express tunnel car washes.</span>
          <span>Not a contract and not an offer of financing.</span>
        </div>
      </footer>
    </div>
  );
}
