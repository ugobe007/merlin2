import re

NEW_PANEL = '''\
/* ─────────────────────────────────────────────────────────────────────────────
 * AgentTelemetryPanel — Energy Stacking Signal Intelligence™
 * Dark blue/purple deep-space theme with animated metrics, 5-card rotating
 * event feed, bar chart, dot-nav, and countdown progress bar.
 * ─────────────────────────────────────────────────────────────────────────── */

const PANEL_STYLES = `
  .es-panel {
    width:100%;
    background: linear-gradient(145deg,#0d1230 0%,#110d2e 100%);
    border: 1px solid rgba(99,120,255,0.18);
    border-radius: 20px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(155,109,255,0.08),
      0 24px 64px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(255,255,255,0.05);
    position: relative;
    font-family: 'Space Grotesk', sans-serif;
    color: #e8eaf6;
  }
  .es-panel::before {
    content:'';position:absolute;top:-80px;right:-60px;width:320px;height:320px;
    background:radial-gradient(circle,rgba(155,109,255,0.12) 0%,transparent 70%);
    pointer-events:none;z-index:0;
  }
  .es-panel::after {
    content:'';position:absolute;bottom:-60px;left:-40px;width:240px;height:240px;
    background:radial-gradient(circle,rgba(79,138,255,0.10) 0%,transparent 70%);
    pointer-events:none;z-index:0;
  }
  .es-panel > * { position:relative;z-index:1; }
  .es-metric-val {
    font-family:'JetBrains Mono',monospace;
    font-size:26px;font-weight:700;line-height:1;
    background:linear-gradient(135deg,#4f8aff,#9b6dff);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .es-metric-val.amber {
    background:linear-gradient(135deg,#f59e0b,#fb923c);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .es-metric-val.green {
    background:linear-gradient(135deg,#34d399,#6ee7b7);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .es-event-card {
    position:absolute;top:0;left:0;right:0;
    padding:0 16px 16px;
    display:flex;flex-direction:column;gap:10px;
    opacity:0;transform:translateY(16px);
    transition:opacity 0.5s ease,transform 0.5s ease;
    pointer-events:none;
  }
  .es-event-card.active {opacity:1;transform:translateY(0);pointer-events:auto;}
  .es-event-card.exit {opacity:0;transform:translateY(-16px);}
  .es-bar { width:10px;border-radius:3px 3px 0 0;transition:height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
  .es-dot { width:6px;height:6px;border-radius:50%;background:rgba(74,85,104,1);cursor:pointer;transition:all 0.3s; }
  .es-dot.active { width:18px;border-radius:3px;background:#9b6dff;box-shadow:0 0 8px #9b6dff; }
  .es-live-dot {
    width:6px;height:6px;border-radius:50%;
    background:#34d399;box-shadow:0 0 8px #34d399;
    animation:es-pulse 2s ease-in-out infinite;
  }
  @keyframes es-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  @keyframes es-prog { from{width:0%} to{width:100%} }
  .es-prog-fill {
    height:100%;
    background:linear-gradient(90deg,#4f8aff,#9b6dff);
    border-radius:2px;
    animation:es-prog 5s linear infinite;
  }
  .es-spark-bar { flex:1;border-radius:2px 2px 0 0;transition:height 0.4s ease; }
  .es-btn {
    font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;
    letter-spacing:0.06em;padding:6px 14px;border-radius:8px;border:none;cursor:pointer;transition:all 0.2s;
  }
  .es-btn-ghost {
    background:transparent;border:1px solid rgba(99,120,255,0.18);color:#8892b0;
  }
  .es-btn-ghost:hover { border-color:rgba(130,100,255,0.45);color:#e8eaf6;background:rgba(255,255,255,0.04); }
  .es-btn-primary {
    background:linear-gradient(135deg,#4f8aff,#9b6dff);color:#fff;border:none;
    box-shadow:0 4px 16px rgba(79,138,255,0.3);
  }
  .es-btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,138,255,0.45); }
`;

// ─── Event card data ──────────────────────────────────────────────────────────
const ES_CARDS = [
  {
    rows: [
      {
        icon: "⚡", iconBg: "rgba(155,109,255,0.15)", name: "Grid Dependence",
        badge: "Pending ZIP", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#f59e0b", badgeBorder: "rgba(245,158,11,0.25)",
        value: "Baseline", valueColor: "#9b6dff",
        desc: "Select ZIP to localize utility exposure and refine stack profile.",
      },
      {
        icon: "📈", iconBg: "rgba(245,158,11,0.15)", name: "Peak Charge",
        badge: "Active", badgeBg: "rgba(52,211,153,0.12)", badgeColor: "#34d399", badgeBorder: "rgba(52,211,153,0.25)",
        value: "16–24%", valueColor: "#f59e0b",
        desc: "Estimated reduction potential · 2–4 hr backup window.",
      },
    ],
    wide: {
      icon: "🏗️", iconBg: "rgba(79,138,255,0.15)", name: "Recommended Stack Architecture",
      badge: "Optimized", badgeBg: "rgba(79,138,255,0.12)", badgeColor: "#4f8aff", badgeBorder: "rgba(79,138,255,0.25)",
      value: "Solar + BESS + Utility", valueColor: "#4f8aff", valueFontSize: "18px",
      desc: "Co-optimized across utility, storage, and generation assets.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "💸", iconBg: "rgba(248,113,113,0.15)", name: "Tariff Exposure",
        badge: "High Risk", badgeBg: "rgba(248,113,113,0.12)", badgeColor: "#f87171", badgeBorder: "rgba(248,113,113,0.25)",
        value: "$0.31/kWh", valueColor: "#f87171",
        desc: "TOU peak rate window · 4–9 PM daily exposure detected.",
      },
      {
        icon: "🛡️", iconBg: "rgba(52,211,153,0.15)", name: "Resilience Score",
        badge: "Strong", badgeBg: "rgba(52,211,153,0.12)", badgeColor: "#34d399", badgeBorder: "rgba(52,211,153,0.25)",
        value: "88/100", valueColor: "#34d399",
        desc: "Backup coverage: 6–8 hr critical load window available.",
      },
    ],
    wide: {
      icon: "📊", iconBg: "rgba(192,132,252,0.15)", name: "Tariff Arbitrage Opportunity",
      badge: "Detected", badgeBg: "rgba(155,109,255,0.12)", badgeColor: "#c084fc", badgeBorder: "rgba(155,109,255,0.25)",
      value: null, valueColor: "#c084fc", valueFontSize: "22px",
      desc: "Charge during off-peak (12–6 AM) · discharge at TOU peak · est. $420/mo savings.",
      sparkline: ["#4f8aff","#6b7fff","#9b6dff","#c084fc","#e879f9","#f59e0b","#fb923c","#34d399"],
    },
  },
  {
    rows: [
      {
        icon: "⚙️", iconBg: "rgba(79,138,255,0.15)", name: "Load Behavior",
        badge: "Profiled", badgeBg: "rgba(79,138,255,0.12)", badgeColor: "#4f8aff", badgeBorder: "rgba(79,138,255,0.25)",
        value: "142 kW", valueColor: "#4f8aff",
        desc: "Peak demand · avg. 94 kW baseline · 51% variance detected.",
      },
      {
        icon: "🕐", iconBg: "rgba(52,211,153,0.15)", name: "Dispatch Window",
        badge: "Open", badgeBg: "rgba(52,211,153,0.12)", badgeColor: "#34d399", badgeBorder: "rgba(52,211,153,0.25)",
        value: "3.5 hr", valueColor: "#34d399",
        desc: "Optimal dispatch: 5–8:30 PM · grid signal aligned.",
      },
    ],
    wide: {
      icon: "🔋", iconBg: "rgba(245,158,11,0.15)", name: "BESS State of Charge",
      badge: "Charging", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#f59e0b", badgeBorder: "rgba(245,158,11,0.25)",
      value: "67%", valueColor: "#f59e0b", valueFontSize: "22px",
      desc: "Target 95% by 4:30 PM · current charge rate 48 kW · ETA 1h 22m.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "📡", iconBg: "rgba(155,109,255,0.15)", name: "Demand Response",
        badge: "Enrolled", badgeBg: "rgba(155,109,255,0.12)", badgeColor: "#c084fc", badgeBorder: "rgba(155,109,255,0.25)",
        value: "DR-3", valueColor: "#9b6dff",
        desc: "Program tier active · next event forecast: Thu 5–7 PM.",
      },
      {
        icon: "🌿", iconBg: "rgba(52,211,153,0.15)", name: "Carbon Intensity",
        badge: "Low", badgeBg: "rgba(52,211,153,0.12)", badgeColor: "#34d399", badgeBorder: "rgba(52,211,153,0.25)",
        value: "182 g/kWh", valueColor: "#34d399",
        desc: "Grid carbon now 38% below daily avg · optimal charge window.",
      },
    ],
    wide: {
      icon: "💰", iconBg: "rgba(79,138,255,0.15)", name: "Revenue Stack Forecast",
      badge: "Projected", badgeBg: "rgba(79,138,255,0.12)", badgeColor: "#4f8aff", badgeBorder: "rgba(79,138,255,0.25)",
      value: "$1,840/mo", valueColor: "#4f8aff", valueFontSize: "22px",
      desc: "Demand charge savings $920 · DR incentive $480 · arbitrage $440.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "☀️", iconBg: "rgba(245,158,11,0.15)", name: "Solar Forecast",
        badge: "Today", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#f59e0b", badgeBorder: "rgba(245,158,11,0.25)",
        value: "312 kWh", valueColor: "#f59e0b",
        desc: "Peak generation 11 AM–2 PM · cloud cover 12% · 94% confidence.",
      },
      {
        icon: "⚠️", iconBg: "rgba(248,113,113,0.15)", name: "Grid Events",
        badge: "Alert", badgeBg: "rgba(248,113,113,0.12)", badgeColor: "#f87171", badgeBorder: "rgba(248,113,113,0.25)",
        value: "2", valueColor: "#f87171",
        desc: "Stress events forecast this week · pre-charge strategy recommended.",
      },
    ],
    wide: {
      icon: "🎯", iconBg: "rgba(192,132,252,0.15)", name: "Stack Optimization Signal",
      badge: "Active", badgeBg: "rgba(155,109,255,0.12)", badgeColor: "#c084fc", badgeBorder: "rgba(155,109,255,0.25)",
      value: "+18% efficiency", valueColor: "#c084fc", valueFontSize: "22px",
      desc: "Merlin recommends shifting 40 kWh to off-peak · stack reconfigured automatically.",
      sparkline: null,
    },
  },
];

function EsEventItem({
  icon, iconBg, name, badge, badgeBg, badgeColor, badgeBorder,
  value, valueColor, valueFontSize = "22px", desc, fullWidth = false, sparkline = null,
}: {
  icon: string; iconBg: string; name: string;
  badge: string; badgeBg: string; badgeColor: string; badgeBorder: string;
  value: string | null; valueColor: string; valueFontSize?: string;
  desc: string; fullWidth?: boolean; sparkline?: string[] | null;
}) {
  return (
    <div
      style={{
        background: "#111a3e", border: "1px solid rgba(99,120,255,0.18)",
        borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 8,
        ...(fullWidth ? { gridColumn: "1 / -1" } : {}),
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "#162050";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(130,100,255,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "#111a3e";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,120,255,0.18)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
            {icon}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#8892b0" }}>{name}</div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>
          {badge}
        </div>
      </div>
      {sparkline ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28, marginTop: 2 }}>
          {sparkline.map((c, i) => (
            <div key={i} className="es-spark-bar" style={{ height: `${[40,60,80,55,90,70,45,85][i]}%`, background: c }} />
          ))}
        </div>
      ) : value ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: valueFontSize, fontWeight: 700, lineHeight: 1, color: valueColor }}>{value}</div>
      ) : null}
      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function AgentTelemetryPanel({
  modelPreview,
}: {
  modelPreview: {
    zip: string;
    gridRiskShift: string;
    peakReductionPct: string;
    stackCandidate: string;
    backupHours: string;
    decisionPriority: string;
  };
}) {
  const [activeCard, setActiveCard] = useState(0);
  const [exitCard, setExitCard] = useState<number | null>(null);
  const [progKey, setProgKey] = useState(0);
  const [barHeights, setBarHeights] = useState([28, 38, 48, 34, 42]);

  const zipSeed = modelPreview.zip.length === 5 ? Number.parseInt(modelPreview.zip, 10) % 100 : 0;

  const metrics = [
    { id: "gsi", label: "Grid Stress Index", base: 58, range: 10, suffix: "/100", colorClass: "" },
    { id: "sfs", label: "Stack Fit Score", base: 62, range: 9, suffix: "/100", colorClass: "amber" },
    { id: "dr", label: "Dispatch Readiness", base: 70, range: 8, suffix: "%", colorClass: "green" },
  ];

  const [metricVals, setMetricVals] = useState(
    metrics.map((m) => m.base + (zipSeed % m.range))
  );

  // Animate metrics every 7s
  useEffect(() => {
    const t = setInterval(() => {
      setMetricVals(metrics.map((m) => m.base + Math.floor(Math.random() * m.range)));
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Animate bars every 3s
  useEffect(() => {
    const t = setInterval(() => {
      setBarHeights([0,0,0,0,0].map(() => Math.floor(Math.random() * 36) + 16));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate cards every 5s
  useEffect(() => {
    const t = setInterval(() => {
      goTo((activeCard + 1) % ES_CARDS.length);
    }, 5000);
    return () => clearInterval(t);
  }, [activeCard]);

  function goTo(idx: number) {
    if (idx === activeCard) return;
    setExitCard(activeCard);
    setActiveCard(idx);
    setProgKey((k) => k + 1);
    setTimeout(() => setExitCard(null), 500);
  }

  const barColors = [
    "linear-gradient(to top,#4f8aff,#9b6dff)",
    "linear-gradient(to top,#9b6dff,#c084fc)",
    "linear-gradient(to top,#c084fc,#e879f9)",
    "linear-gradient(to top,#f59e0b,#fb923c)",
    "linear-gradient(to top,#34d399,#6ee7b7)",
  ];

  return (
    <div className="es-panel">
      <style>{PANEL_STYLES}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(99,120,255,0.18)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#1a1f4e,#2a1a5e)", border: "1px solid rgba(130,100,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(155,109,255,0.25)", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#esp-g1)" opacity="0.9"/>
              <path d="M2 12l10 5 10-5" stroke="url(#esp-g2)" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M2 17l10 5 10-5" stroke="url(#esp-g3)" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
              <defs>
                <linearGradient id="esp-g1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f8aff"/><stop offset="100%" stopColor="#9b6dff"/></linearGradient>
                <linearGradient id="esp-g2" x1="2" y1="12" x2="22" y2="17" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#9b6dff"/><stop offset="100%" stopColor="#c084fc"/></linearGradient>
                <linearGradient id="esp-g3" x1="2" y1="17" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#4f8aff"/></linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.01em", color: "#e8eaf6", lineHeight: 1.2 }}>Energy Stacking</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9b6dff", marginTop: 2 }}>Signal Intelligence™</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(79,138,255,0.1)", border: "1px solid rgba(79,138,255,0.25)", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#4f8aff", textTransform: "uppercase" }}>
          <div className="es-live-dot" />
          Live Feed
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(99,120,255,0.18)", borderBottom: "1px solid rgba(99,120,255,0.18)" }}>
        {metrics.map((m, i) => (
          <div key={m.id} style={{ background: "#0d1230", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6, cursor: "default", transition: "background 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#111a3e"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#0d1230"; }}
          >
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a5568" }}>{m.label}</div>
            <div className={`es-metric-val${m.colorClass ? ` ${m.colorClass}` : ""}`} style={{ transition: "all 0.5s ease" }}>
              {metricVals[i]}<span style={{ fontSize: 14, opacity: 0.6 }}>{m.suffix}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "#4a5568", display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
              Baseline
            </div>
          </div>
        ))}
      </div>

      {/* Chart Strip */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "flex-end", gap: 12, borderBottom: "1px solid rgba(99,120,255,0.18)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ flex: 1, fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
          <strong style={{ color: "#e8eaf6" }}>Merlin</strong> translates load behavior, tariff variability, and resilience constraints into one orchestrated stack strategy with measurable operating signals.
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52, flexShrink: 0 }}>
          {barHeights.map((h, i) => (
            <div key={i} className="es-bar" style={{ height: h, background: barColors[i] }} />
          ))}
        </div>
      </div>

      {/* Feed Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a5568" }}>Live Event Variables</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <div key={progKey} className="es-prog-fill" />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#4a5568" }}>{activeCard + 1} / {ES_CARDS.length}</div>
        </div>
      </div>

      {/* Event Viewport */}
      <div style={{ position: "relative", minHeight: 220 }}>
        {ES_CARDS.map((card, ci) => (
          <div
            key={ci}
            className={`es-event-card${activeCard === ci ? " active" : ""}${exitCard === ci ? " exit" : ""}`}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {card.rows.map((row, ri) => (
                <EsEventItem key={ri} {...row} />
              ))}
            </div>
            <EsEventItem {...card.wide} fullWidth sparkline={card.wide.sparkline ?? null} />
          </div>
        ))}
      </div>

      {/* Dot Nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "10px 0 4px" }}>
        {ES_CARDS.map((_, i) => (
          <div
            key={i}
            className={`es-dot${activeCard === i ? " active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#4a5568", textAlign: "center", padding: "0 24px 8px", letterSpacing: "0.06em" }}>
        Auto-rotating every 5s · click dots to navigate
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(99,120,255,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ fontSize: 11, color: "#4a5568", display: "flex", alignItems: "center", gap: 6 }}>
          {modelPreview.zip.length === 5
            ? <>Localized to ZIP <span style={{ color: "#9b6dff", fontWeight: 600 }}>{modelPreview.zip}</span></>
            : <>Showing baseline signals · <span style={{ color: "#9b6dff", fontWeight: 600, cursor: "pointer" }}>Add ZIP to localize</span></>
          }
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="es-btn es-btn-ghost" type="button">Export</button>
          <button className="es-btn es-btn-primary" type="button" onClick={() => { window.location.href = "/wizard"; }}>Add ZIP →</button>
        </div>
      </div>
    </div>
  );
}
'''

with open('/Users/robertchristopher/merlin2/src/components/HeroSection.tsx', 'r') as f:
    src = f.read()

# Replace everything from the AgentTelemetryPanel function declaration through the closing brace
# Find start: 'function AgentTelemetryPanel('
# Find end: the closing of the export default function HeroSection starts

start_marker = 'function AgentTelemetryPanel({'
end_marker = 'export default function HeroSection()'

start_idx = src.index(start_marker)
end_idx = src.index(end_marker)

new_src = src[:start_idx] + NEW_PANEL + '\n\n' + src[end_idx:]

with open('/Users/robertchristopher/merlin2/src/components/HeroSection.tsx', 'w') as f:
    f.write(new_src)

print(f"Done. New file: {new_src.count(chr(10))} lines")
