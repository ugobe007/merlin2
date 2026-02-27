/**
 * TWITTER / X BANNER — /banner
 * ============================
 * Renders at exactly 1500×500px — screenshot this tab at 100% zoom.
 * Use browser zoom: Cmd+0 to reset, then screenshot the banner div.
 * Feb 25, 2026
 */

import React, { useState } from "react";

const WIZARD_SRC = "/merlin-wizard-new.png";

const QUOTE_EXAMPLES = [
  { key: "datacenter", label: "Data Center", industry: "Enterprise Data Center", location: "Ashburn, VA", system: "5 MW / 20 MWh BESS", savings: "$1.3M", payback: "1.7 yrs", roi: "473%", itc: "$940K", netCost: "$2.2M", npv: "$11.4M" },
  { key: "hospital",   label: "Hospital",    industry: "Regional Hospital",       location: "Austin, TX",   system: "1.5 MW / 6 MWh BESS", savings: "$665K", payback: "1.0 yr",  roi: "891%", itc: "$288K", netCost: "$672K",  npv: "$6.4M"  },
  { key: "ev",         label: "EV Charging", industry: "EV Charging Hub",         location: "Dallas, TX",   system: "2 MW / 8 MWh BESS + Solar", savings: "$522K", payback: "1.7 yrs", roi: "483%", itc: "$383K", netCost: "$895K",  npv: "$4.7M"  },
  { key: "carwash",   label: "Car Wash",    industry: "Tunnel Car Wash",         location: "Los Angeles, CA", system: "0.7 MW / 2.6 MWh BESS", savings: "$193K", payback: "1.5 yrs", roi: "565%", itc: "$125K", netCost: "$291K",  npv: "$1.8M"  },
  { key: "airport",   label: "Airport",     industry: "Regional Airport",        location: "Chicago, IL",  system: "4 MW / 16 MWh BESS + Solar", savings: "$1.1M", payback: "1.6 yrs", roi: "532%", itc: "$771K", netCost: "$1.8M",  npv: "$10.3M" },
];

export default function TwitterBanner() {
  const [imgIdx, setImgIdx] = useState(0);
  const [showWizard, setShowWizard] = useState(true);
  const current = QUOTE_EXAMPLES[imgIdx];
  return (
    <div
      style={{
        background: "#040b18",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Download assets row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "⬇ Wizard Icon — 512×512 (app icon)", href: "/merlin-wizard-new.png", filename: "merlin-icon-512.png" },
          { label: "⬇ Wizard Full — 1024×1024 (profile pic)", href: "/merlin-wizard-full.png", filename: "merlin-wizard-1024.png" },
        ].map(btn => (
          <a
            key={btn.href}
            href={btn.href}
            download={btn.filename}
            style={{
              padding: "8px 18px", borderRadius: 8, textDecoration: "none",
              border: "1px solid rgba(62,207,142,0.40)",
              background: "rgba(62,207,142,0.10)",
              color: "#3ECF8E", fontSize: 13, fontWeight: 600,
            }}
          >
            {btn.label}
          </a>
        ))}
      </div>

      {/* Instructions */}
      <div
        style={{
          color: "#ffffff60",
          fontSize: 13,
          marginBottom: 16,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        📐 Twitter banner is <strong style={{ color: "#3ECF8E" }}>1500 × 500px</strong>.
        Set browser zoom to <strong style={{ color: "#3ECF8E" }}>100%</strong> (Cmd+0),
        then screenshot the card below.
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
        <button
          onClick={() => setShowWizard(v => !v)}
          style={{
            padding: "6px 16px", borderRadius: 8,
            border: `1px solid ${showWizard ? "#3ECF8E" : "rgba(255,255,255,0.15)"}`,
            background: showWizard ? "rgba(62,207,142,0.15)" : "rgba(255,255,255,0.05)",
            color: showWizard ? "#3ECF8E" : "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          🧙 {showWizard ? "Wizard ON" : "Wizard OFF"}
        </button>
      </div>

      {/* Industry switcher */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {QUOTE_EXAMPLES.map((img, i) => (
          <button
            key={img.key}
            onClick={() => setImgIdx(i)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${i === imgIdx ? "#3ECF8E" : "rgba(255,255,255,0.15)"}`,
              background: i === imgIdx ? "rgba(62,207,142,0.15)" : "rgba(255,255,255,0.05)",
              color: i === imgIdx ? "#3ECF8E" : "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {img.label}
          </button>
        ))}
      </div>

      {/* THE BANNER — exactly 1500×500 */}
      <div
        id="twitter-banner"
        style={{
          width: 1500,
          height: 500,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          background: "linear-gradient(135deg, #020c1e 0%, #030f28 40%, #040d20 70%, #010810 100%)",
          boxShadow: "0 0 80px rgba(62, 207, 142, 0.15), 0 0 200px rgba(14, 48, 87, 0.4)",
          flexShrink: 0,
        }}
      >
        {/* Subtle grid overlay */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3ECF8E" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Left emerald glow orb */}
        <div style={{
          position: "absolute", left: -100, top: -80,
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(62,207,142,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Right blue glow orb */}
        <div style={{
          position: "absolute", right: 200, bottom: -120,
          width: 600, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,80,160,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* ── LEFT SECTION: Wordmark + tagline ── */}
        <div style={{
          position: "absolute",
          left: 80,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 640,
        }}>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
            <div>
              <div style={{
                fontSize: 64,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-2px",
                lineHeight: 1,
                fontFamily: "Inter, system-ui, sans-serif",
              }}>
                Merlin
                <span style={{ color: "#3ECF8E" }}> Energy</span>
              </div>
              <div style={{
                fontSize: 20,
                color: "#3ECF8E",
                fontWeight: 500,
                letterSpacing: "0.04em",
                marginTop: 8,
                opacity: 0.90,
                fontStyle: "italic",
              }}>
                Energy intelligence, instantly conjured.
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.4,
            fontWeight: 400,
            maxWidth: 560,
            marginBottom: 28,
          }}>
            Bankable energy quotes for any project —
            <span style={{ color: "#3ECF8E", fontWeight: 600 }}> TrueQuote™ verified</span>.
            <br />
            From site to investor-ready proposal in 90 seconds.
          </div>

          {/* Pill badges */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["NREL ATB 2024", "IRA 2022 ITC", "Monte Carlo P10/P50/P90", "15+ Industries", "Free Forever Tier"].map(label => (
              <div key={label} style={{
                padding: "6px 16px",
                borderRadius: 100,
                border: "1px solid rgba(62,207,142,0.35)",
                background: "rgba(62,207,142,0.08)",
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT SECTION: Merlin wizard behind quote card ── */}
        {showWizard && (
          <img
            src={WIZARD_SRC}
            alt="Merlin"
            style={{
              position: "absolute",
              right: -30,
              bottom: -20,
              height: 520,
              width: 520,
              objectFit: "contain",
              opacity: 0.92,
              filter: "drop-shadow(0 0 40px rgba(62,207,142,0.25)) drop-shadow(0 0 80px rgba(90,80,200,0.30))",
              pointerEvents: "none",
            }}
          />
        )}

        {/* ── RIGHT SECTION: Financial Quote Card ── */}
        <div style={{
          position: "absolute",
          right: showWizard ? 220 : 44,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          width: 400,
          transition: "right 0.3s ease",
        }}>
          {/* Ambient glow behind card */}
          <div style={{
            position: "absolute", inset: -40,
            background: "radial-gradient(ellipse at center, rgba(62,207,142,0.09) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />

          {/* Quote card */}
          <div style={{
            width: "100%",
            background: "rgba(6, 16, 44, 0.92)",
            border: "1px solid rgba(62,207,142,0.26)",
            borderRadius: 18,
            padding: "22px 26px",
            boxShadow: "0 0 60px rgba(62,207,142,0.08), 0 24px 64px rgba(0,0,0,0.60), inset 0 1px 0 rgba(62,207,142,0.10)",
            position: "relative",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3ECF8E", boxShadow: "0 0 8px rgba(62,207,142,0.9)" }} />
                <span style={{ fontSize: 11, color: "#3ECF8E", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
                  TrueQuote™ Result
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.03em" }}>
                NREL ATB 2024 · IRA 2022
              </span>
            </div>

            {/* Industry + system */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.95)", fontWeight: 700, marginBottom: 3 }}>
                {current.industry}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.36)" }}>
                {current.location} · {current.system}
              </div>
            </div>

            {/* Hero metric: Annual Savings */}
            <div style={{
              background: "rgba(62,207,142,0.07)",
              border: "1px solid rgba(62,207,142,0.20)",
              borderRadius: 12,
              padding: "13px 18px",
              marginBottom: 13,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Annual Savings</span>
              <span style={{ fontSize: 30, fontWeight: 900, color: "#3ECF8E", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {current.savings}
                <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(62,207,142,0.60)", marginLeft: 3 }}>/yr</span>
              </span>
            </div>

            {/* 4-metric grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 14 }}>
              {([
                { label: "Payback Period", value: current.payback, bright: false },
                { label: "25-yr ROI",     value: current.roi,     bright: true  },
                { label: "ITC Credit",    value: current.itc,     bright: false },
                { label: "NPV (25-yr)",   value: current.npv,     bright: true  },
              ] as { label: string; value: string; bright: boolean }[]).map(m => (
                <div key={m.label} style={{
                  display: "flex", flexDirection: "column", gap: 2,
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>{m.label}</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: m.bright ? "#3ECF8E" : "rgba(255,255,255,0.88)" }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              paddingTop: 11,
              borderTop: "1px solid rgba(62,207,142,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
                Net Cost After ITC: {current.netCost}
              </span>
              <span style={{ fontSize: 10, color: "#3ECF8E", fontWeight: 700, opacity: 0.65, letterSpacing: "0.05em" }}>
                ✓ VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* ── URL watermark bottom right ── */}
        <div style={{
          position: "absolute",
          bottom: 24,
          right: 80,
          color: "rgba(255,255,255,0.3)",
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}>
          merlinenergy.net
        </div>

        {/* ── Bottom emerald accent line ── */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, transparent 0%, #3ECF8E 30%, #22d3ee 60%, transparent 100%)",
          opacity: 0.7,
        }} />
      </div>

      {/* Size indicator */}
      <div style={{ color: "#ffffff30", fontSize: 12, marginTop: 16 }}>
        1500 × 500px · @Merlin_Energy
      </div>
    </div>
  );
}
