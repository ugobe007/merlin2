import { useEffect, useMemo, useRef, useState } from "react";
import LOOKUP from "@/data/utility_zip_lookup.json";
import {
  resolveUtility,
  type UtilityLookup,
  type UtilityResolution,
} from "@/services/carwashUtilityResolve.js";
import { buildDiagnostic, takePendingBill, type BillMode, type WashType } from "./model";
import QuoteDocument from "./QuoteDocument";
import { buildQuoteRequest, type ApiQuote, type QuoteRequestContext } from "./quoteApi";
import "./carwash.css";
import "./home.css";

type WashHit = { placeId: string; name: string; formattedAddress: string };

const STORE = "merlin-dx-v1";
const WASHES: WashType[] = ["tunnel", "iba", "self-serve", "detail"];

const WASH_LABEL: Record<WashType, string> = {
  tunnel: "Express tunnel",
  iba: "In-bay automatic",
  "self-serve": "Self-serve",
  detail: "Detail",
};

function shortPlace(address: string) {
  const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})\b/);
  if (match) return `${match[1].trim()}, ${match[2]}`;
  return address.trim() || "This site";
}

function readStore(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function gateFor(
  address: string,
  resolution: UtilityResolution
): "empty" | "resolved" | "ambiguous" | "weak" | "unknown" {
  if (!address.trim()) return "empty";
  if (resolution.confidence === "ambiguous") return "ambiguous";
  if (resolution.resolved && resolution.region?.verdict === "weak") return "weak";
  if (resolution.resolved && resolution.mayProduceEstimate) return "resolved";
  return "unknown";
}

function matchTyped(name: string): string | null {
  const query = name.trim().toLowerCase();
  if (query.length < 2) return null;
  const hit = (LOOKUP as UtilityLookup).regions.find(
    (region) =>
      region.utility.toLowerCase() === query ||
      region.shortName.toLowerCase() === query ||
      region.id.replace(/_/g, " ") === query
  );
  return hit?.id ?? null;
}

function rateBand(low?: number | null, high?: number | null) {
  if (low == null || high == null) return "not modelled";
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${fmt(low)}–${fmt(high)}`;
}

export default function PeakDemandDiagnostic() {
  const params = new URLSearchParams(window.location.search);
  const saved = readStore();
  const urlAddress = params.get("address") ?? "";
  const urlZip = params.get("zip") || urlAddress.match(/\b(\d{5})\b/)?.[1] || "";
  const urlUtility = params.get("utility");
  const resume = Boolean(saved) && (!urlAddress || saved?.address === urlAddress);
  const [step, setStep] = useState(resume ? Number(saved?.step) || 0 : 0);
  const [address, setAddress] = useState(urlAddress || (resume ? saved?.address : "") || "");
  const [zip, setZip] = useState(urlZip || (resume ? saved?.zip || "" : ""));
  const [hits, setHits] = useState<WashHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [placesNote, setPlacesNote] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [chosen, setChosen] = useState<{ name: string; address: string } | null>(
    urlAddress
      ? { name: params.get("brand") || urlAddress.split(",")[0].trim(), address: urlAddress }
      : null
  );
  const [locOpen, setLocOpen] = useState(Boolean(urlAddress) || Boolean(resume && saved?.address));
  const [wash, setWash] = useState<WashType>(
    resume && saved?.wash ? (saved.wash as WashType) : "tunnel"
  );
  const [cars, setCars] = useState(resume ? (saved?.cars ?? "") : "");
  const [carsUnsure, setCarsUnsure] = useState(resume && saved?.carsUnsure === "1");
  const [days, setDays] = useState(resume ? saved?.days || "6" : "6");
  const [tenure, setTenure] = useState<"own" | "lease">(
    resume && saved?.tenure === "lease" ? "lease" : "own"
  );
  const [pickedId, setPickedId] = useState<string | null>(
    urlUtility || (resume ? saved?.pickedId || null : null)
  );
  const [typedUtility, setTypedUtility] = useState(resume ? saved?.typedUtility || "" : "");
  const [pathMode, setPathMode] = useState<"full" | "dr" | "storage">(
    resume && (saved?.pathMode === "dr" || saved?.pathMode === "storage") ? saved.pathMode : "full"
  );
  const [pendingFile] = useState<File | null>(() => takePendingBill());
  const [billMode, setBillMode] = useState<BillMode>(
    pendingFile ? "upload" : resume && saved?.billMode ? (saved.billMode as BillMode) : "unknown"
  );
  const [billNote, setBillNote] = useState<string | null>(resume ? saved?.billNote || null : null);
  const [billedKw, setBilledKw] = useState("");
  const [monthlyKwh, setMonthlyKwh] = useState("");
  const [demandCharge, setDemandCharge] = useState<number | null>(
    resume && saved?.demandCharge ? Number(saved.demandCharge) : null
  );
  const [_utilityOnBill, setUtilityOnBill] = useState("");
  const [quoteState, setQuoteState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; quote: ApiQuote; context: QuoteRequestContext }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const resolution = useMemo(
    () => resolveUtility(/^\d{5}$/.test(zip) ? zip : address, LOOKUP as UtilityLookup),
    [zip, address]
  );
  const addressRef = useRef(address);
  useEffect(() => {
    if (addressRef.current === address) return;
    addressRef.current = address;
    setPickedId(null);
    setTypedUtility("");
    setPathMode("full");
  }, [address]);

  const gate = gateFor(address, resolution);
  useEffect(() => {
    if (gate !== "weak" && pathMode !== "full") setPathMode("full");
  }, [gate, pathMode]);
  const typedId = matchTyped(typedUtility);
  const chosenId =
    gate === "ambiguous"
      ? pickedId === "other"
        ? typedId
        : pickedId
      : gate === "resolved" || gate === "weak"
        ? (resolution.region?.utilityId ?? null)
        : typedId;
  const result = useMemo(
    () =>
      buildDiagnostic({
        address,
        wash,
        billMode,
        billedKw: Number(billedKw) || null,
        demandCharge,
        utilityId: chosenId,
      }),
    [address, wash, billMode, billedKw, demandCharge, chosenId]
  );
  const billReady = Boolean(pendingFile) || (billMode === "upload" && Boolean(billNote));
  const shortBar = pathMode === "dr";
  const labels = shortBar
    ? ["Find the wash", "Quote"]
    : ["Find the wash", "Your wash", "Your bill", "Quote"];
  const barIndex = shortBar ? (step === 0 ? 0 : 1) : step;

  useEffect(() => {
    localStorage.setItem(
      STORE,
      JSON.stringify({
        address,
        zip,
        step,
        wash,
        cars,
        carsUnsure: carsUnsure ? "1" : "0",
        days,
        tenure,
        pickedId,
        typedUtility,
        pathMode,
        billMode,
        billedKw,
        monthlyKwh,
        billNote,
        demandCharge,
      })
    );
  }, [
    address,
    zip,
    step,
    wash,
    cars,
    carsUnsure,
    days,
    tenure,
    pickedId,
    typedUtility,
    pathMode,
    billMode,
    billedKw,
    monthlyKwh,
    billNote,
    demandCharge,
  ]);

  useEffect(() => {
    if (!/^\d{5}$/.test(zip)) {
      setHits([]);
      setPlacesNote(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    setPlacesNote(null);
    fetch("/api/places/car-washes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postalCode: zip }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { ok?: boolean; reason?: string; results?: WashHit[] }) => {
        setHits(payload.results || []);
        if (payload.ok === false && payload.reason === "unavailable") {
          setPlacesNote(
            "Places is unavailable, so this ZIP can't list the washes yet. Type the name and the ZIP still sets the utility."
          );
        } else if ((payload.results || []).length === 0) {
          setPlacesNote("No car washes came back for this ZIP. Type the name and we'll use it.");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPlacesNote(
          "Places is unavailable, so this ZIP can't list the washes yet. Type the name and the ZIP still sets the utility."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [zip]);

  function onZip(value: string) {
    setZip(value.replace(/\D/g, "").slice(0, 5));
    setChosen(null);
    setLocOpen(false);
    setAddress("");
    setTypedName("");
  }

  function chooseWash(hit: { name: string; address: string }) {
    setChosen(hit);
    setAddress(hit.address);
    setLocOpen(true);
  }

  function claimLocation() {
    setPathMode("full");
    setStep(1);
  }

  async function readBill(file: File) {
    setBillMode("upload");
    setBillNote(file.name);
    try {
      const { parseDocuments } = await import("@/services/documentParserService");
      const { extractSpecsFromDocuments } = await import("@/services/openAIExtractionService");
      const parsed = await parseDocuments([file]);
      const extracted = await extractSpecsFromDocuments(parsed, {
        documentTypes: ["utility-bill"],
      });
      const peak = extracted.powerRequirements?.peakDemandKW;
      const charge = extracted.utilityInfo?.demandCharge;
      const provider = extracted.utilityInfo?.utilityProvider;
      if (peak) setBilledKw(String(peak));
      if (charge) setDemandCharge(charge);
      if (provider) setUtilityOnBill(provider);
      if (!peak && !charge)
        setBillNote(
          `${file.name} is saved. We could not read a demand figure from it yet, so the result stays estimated.`
        );
    } catch {
      setBillNote(
        `${file.name} is saved. Reading it failed, so nothing from it is marked certified.`
      );
      setDemandCharge(null);
    }
  }

  useEffect(() => {
    if (pendingFile) void readBill(pendingFile);
    // The file is captured once, from the hero drop zone.
  }, [pendingFile]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("merlin_prefilled_bill");
      if (!raw) return;
      sessionStorage.removeItem("merlin_prefilled_bill");
      const data = JSON.parse(raw) as {
        powerRequirements?: { peakDemandKW?: number; monthlyKWh?: number };
        utilityInfo?: { demandCharge?: number; utilityProvider?: string };
        location?: { address?: string; city?: string; state?: string; zipCode?: string };
      };
      const peak = data.powerRequirements?.peakDemandKW;
      const charge = data.utilityInfo?.demandCharge;
      const provider = data.utilityInfo?.utilityProvider;
      const kwh = data.powerRequirements?.monthlyKWh;
      const loc = data.location;
      const fromBill = [loc?.address, loc?.city, loc?.state, loc?.zipCode]
        .filter(Boolean)
        .join(", ");
      if (peak && peak > 0) {
        setBilledKw(String(peak));
        setBillMode("upload");
        setBillNote("Read from the bill uploaded on the bill page.");
      }
      if (charge && charge > 0) setDemandCharge(charge);
      if (provider) setUtilityOnBill(provider);
      if (kwh && kwh > 0) setMonthlyKwh(String(kwh));
      if (fromBill) setAddress((current) => current.trim() || fromBill);
    } catch {
      sessionStorage.removeItem("merlin_prefilled_bill");
    }
  }, []);

  useEffect(() => {
    if (step !== 3 || address.trim().length < 3) return;
    const { body, context } = buildQuoteRequest({
      address,
      wash,
      billMode,
      billedKw,
      demandCharge,
      territory: result.territory,
    });
    const controller = new AbortController();
    setQuoteState({ status: "loading" });
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || "The quote could not be calculated");
        }
        setQuoteState({ status: "ready", quote: payload as ApiQuote, context });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setQuoteState({
          status: "error",
          message: err instanceof Error ? err.message : "The quote could not be calculated",
        });
      });
    return () => controller.abort();
  }, [step, address, wash, billMode, billedKw, demandCharge, result.territory]);

  return (
    <div className={step < 3 ? "merlin-cw find" : "merlin-cw dx"}>
      <nav className="no-print">
        <div className="wrap navin">
          <a className="logo" href="/">
            <span className="dot" />
            Merlin Energy
          </a>
          <div style={{ fontSize: 13, color: "#5C6F66" }}>
            Peak Demand Diagnostic · Step {barIndex + 1} of {labels.length}
          </div>
        </div>
      </nav>
      <div className="prog no-print">
        <div className="wrap prow">
          {labels.map((label, index) => {
            const target = shortBar ? (index === 0 ? 0 : 3) : index;
            const done = index < barIndex || (label === "Your bill" && billReady && step > 2);
            return (
              <button
                key={label}
                type="button"
                className={`pstep ${done ? "done" : ""} ${index === barIndex ? "active" : ""}`}
                onClick={() => done && setStep(target)}
              >
                <span className="pnum">{done ? "✓" : index + 1}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <div className="wrap">
          {step === 0 && (
            <div className="card step-card">
              <span className="eyebrow">Step 1 — Find the wash</span>
              <h2 style={{ marginTop: 8 }}>Start with the ZIP.</h2>
              <p>
                We'll list the car washes in that ZIP. Pick yours, then confirm the location. The
                bill comes after, and it stays optional.
              </p>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="dx-zip">ZIP code</label>
                <input
                  id="dx-zip"
                  className="zip-entry"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="11214"
                  value={zip}
                  onChange={(e) => onZip(e.target.value)}
                />
              </div>
              {/^\d{5}$/.test(zip) && !locOpen && (
                <>
                  {searching && <p className="note">Looking up car washes in {zip}…</p>}
                  {placesNote && <p className="note">{placesNote}</p>}
                  {hits.length > 0 && (
                    <div className="wash-list">
                      {hits.map((hit) => (
                        <button
                          key={hit.placeId}
                          type="button"
                          className="wash-hit"
                          onClick={() =>
                            chooseWash({ name: hit.name, address: hit.formattedAddress })
                          }
                        >
                          <b>{hit.name}</b>
                          <span>{hit.formattedAddress}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="field" style={{ marginTop: 16 }}>
                    <label htmlFor="dx-name">Or type the wash name</label>
                    <input
                      id="dx-name"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Mister Car Wash"
                    />
                  </div>
                  <button
                    className="btn btn-p"
                    type="button"
                    disabled={typedName.trim().length < 2}
                    onClick={() =>
                      chooseWash({ name: typedName.trim(), address: `${typedName.trim()}, ${zip}` })
                    }
                  >
                    Use this wash
                  </button>
                </>
              )}
              {locOpen && chosen && (
                <div className="picked">
                  <div>
                    <b>{chosen.name}</b>
                    <p style={{ margin: "2px 0 0" }}>{chosen.address}</p>
                  </div>
                  <button className="linkish" type="button" onClick={() => setLocOpen(false)}>
                    Choose a different wash
                  </button>
                </div>
              )}
              {locOpen && gate === "empty" && (
                <p className="note">Add the ZIP to the address so we can name the utility.</p>
              )}
              {locOpen && gate === "resolved" && resolution.region && (
                <div className="resolved">
                  <div className="res-top">
                    <div>
                      <b>{resolution.region.shortName}</b>
                      <p>
                        {resolution.region.rateSchedule} · {resolution.region.state}
                      </p>
                    </div>
                    <span
                      className={`verdict ${resolution.region.verdict === "moderate" ? "v-mid" : "v-go"}`}
                    >
                      {resolution.region.verdict}
                    </span>
                  </div>
                  <div className="brow">
                    <span className="l">Demand charge</span>
                    <span className="v num">
                      {rateBand(
                        resolution.region.demandCharge?.low,
                        resolution.region.demandCharge?.high
                      )}{" "}
                      /kW/mo
                    </span>
                  </div>
                  <p>
                    {resolution.requiresConfirmation
                      ? resolution.message
                      : resolution.region.verdict === "moderate"
                        ? "A real opportunity, and a smaller number than a high-demand utility. We'll test it against the bill."
                        : "Storage pencils at this rate. Keep going — we'll test it against your actual bill."}
                  </p>
                  <button className="btn btn-p" type="button" onClick={claimLocation}>
                    Claim this location
                  </button>
                  <span className="note">
                    Next is the wash, then the bill. The bill is optional.
                  </span>
                </div>
              )}
              {locOpen && gate === "ambiguous" && (
                <div className="warnbox">
                  <b>This ZIP is served by more than one utility.</b>
                  <p>{resolution.message}</p>
                  {resolution.candidates.map((candidate) => (
                    <label className="pick" key={candidate.utilityId}>
                      <input
                        type="radio"
                        name="utility"
                        checked={pickedId === candidate.utilityId}
                        onChange={() => setPickedId(candidate.utilityId)}
                      />
                      <span>
                        <b>{candidate.utility}</b>
                        {candidate.isMunicipal ? " · municipal" : ""}
                      </span>
                      <span className="num">
                        {rateBand(candidate.demandCharge?.low, candidate.demandCharge?.high)}
                      </span>
                    </label>
                  ))}
                  <div className="ctas" style={{ marginTop: 14 }}>
                    <button
                      className="btn btn-p"
                      type="button"
                      disabled={!pickedId}
                      onClick={claimLocation}
                    >
                      Claim this location
                    </button>
                  </div>
                </div>
              )}
              {locOpen && gate === "weak" && resolution.region && (
                <div className="resolved weak">
                  <div className="res-top">
                    <div>
                      <b>{resolution.region.shortName}</b>
                      <p>{resolution.region.rateSchedule}</p>
                    </div>
                    <span className="verdict v-no">Weak</span>
                  </div>
                  <div className="brow">
                    <span className="l">Demand charge</span>
                    <span className="v num">
                      {rateBand(
                        resolution.region.demandCharge?.low,
                        resolution.region.demandCharge?.high
                      )}{" "}
                      /kW/mo
                    </span>
                  </div>
                  <p>
                    The demand charge here is low, so storage may not lead. The quote still prints —
                    system, price, and return — and you keep it.
                  </p>
                  <div className="ctas" style={{ marginTop: 8 }}>
                    <button className="btn btn-p" type="button" onClick={claimLocation}>
                      Claim this location
                    </button>
                  </div>
                </div>
              )}
              {locOpen && gate === "unknown" && (
                <div className="resolved">
                  <p>
                    {/^\d{5}$/.test(zip)
                      ? `ZIP ${zip} sets the utility. ${resolution.message}`
                      : resolution.message}
                  </p>
                  <button className="btn btn-p" type="button" onClick={claimLocation}>
                    Claim this location
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="card step-card">
              <span className="eyebrow">Your wash</span>
              <h2 style={{ marginTop: 8 }}>What kind of wash is it?</h2>
              <div className="picks" style={{ marginTop: 16 }}>
                {WASHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`pick-card ${wash === item ? "on" : ""}`}
                    onClick={() => setWash(item)}
                  >
                    {WASH_LABEL[item]}
                  </button>
                ))}
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label>Cars per day</label>
                <input
                  value={carsUnsure ? "" : cars}
                  disabled={carsUnsure}
                  onChange={(e) => setCars(e.target.value)}
                  placeholder="250"
                />
                <button
                  className="btn btn-s btn-sm"
                  type="button"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    setCarsUnsure((v) => !v);
                    setCars("");
                  }}
                >
                  {carsUnsure ? "I'll enter a number" : "Not sure"}
                </button>
              </div>
              <div className="field">
                <label>Operating days / week</label>
                <div className="picks">
                  {["5", "6", "7"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`pick-card ${days === value ? "on" : ""}`}
                      onClick={() => setDays(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Own or lease</label>
                <div className="picks">
                  <button
                    type="button"
                    className={`pick-card ${tenure === "own" ? "on" : ""}`}
                    onClick={() => setTenure("own")}
                  >
                    Own
                  </button>
                  <button
                    type="button"
                    className={`pick-card ${tenure === "lease" ? "on" : ""}`}
                    onClick={() => setTenure("lease")}
                  >
                    Lease
                  </button>
                </div>
              </div>
              <button
                className="btn btn-p"
                type="button"
                onClick={() => setStep(billReady ? 3 : 2)}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="card step-card">
              <span className="eyebrow">Your bill — optional, recommended</span>
              <h2 style={{ marginTop: 8 }}>Add a bill if you have it.</h2>
              <p>
                A bill is what makes the peak certified. Skip it and you still get a full quote,
                marked estimated. We recommend adding it. We do not take payment details off a bill.
              </p>
              {billReady && (
                <p className="note">
                  A bill is already attached{billNote ? `: ${billNote}` : ""}. You can add another,
                  or go straight to the quote.
                </p>
              )}
              <label className="drop" style={{ marginTop: 16 }}>
                <b>{billNote ?? "Upload a utility bill"}</b>
                <span>This is the only path that can be certified</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void readBill(file);
                  }}
                />
              </label>
              <div className="field">
                <label>Or enter billed demand (kW)</label>
                <input
                  value={billedKw}
                  onChange={(e) => {
                    setBilledKw(e.target.value);
                    setBillMode(e.target.value ? "entered" : billMode);
                  }}
                  placeholder="350"
                />
              </div>
              <div className="field">
                <label>Monthly kWh, if you have it</label>
                <input
                  value={monthlyKwh}
                  onChange={(e) => setMonthlyKwh(e.target.value)}
                  placeholder="20000"
                />
              </div>
              <button
                className="btn btn-s"
                type="button"
                onClick={() => {
                  setBillMode("unknown");
                  setBilledKw("");
                  setDemandCharge(null);
                  setStep(3);
                }}
              >
                Skip the bill
              </button>
              <button
                className="btn btn-p"
                style={{ marginLeft: 10 }}
                type="button"
                onClick={() => setStep(3)}
              >
                See the quote
              </button>
            </div>
          )}

          {step === 3 &&
            (quoteState.status === "loading" || quoteState.status === "idle" ? (
              <div className="q-card">
                <div className="bd">
                  <p>Preparing your quote…</p>
                </div>
              </div>
            ) : quoteState.status === "error" ? (
              <div className="q-card">
                <div className="bd">
                  <h2 className="hd">The quote did not calculate</h2>
                  <p>{quoteState.message}</p>
                </div>
              </div>
            ) : (
              <QuoteDocument
                quote={quoteState.quote}
                place={chosen?.name || shortPlace(address)}
                washLabel={WASH_LABEL[wash]}
                cars={carsUnsure ? "" : cars}
                days={days}
                utilityName={result.territory.utility}
                rateSchedule={result.territory.rateSchedule}
                context={quoteState.context}
                onBill={readBill}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
