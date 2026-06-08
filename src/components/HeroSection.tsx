/* Merlin Energy — Agent-first homepage hero */

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DatabaseZap,
  MapPin,
  Hotel,
  Plane,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { IndustrySlug } from "@/wizard/v8/wizardState";

const _MERLIN_ICON = "/merlin-icon.png";

type UseCase = {
  type: string;
  location: string;
  status: string;
  savings: string;
  active: boolean;
  Icon: typeof Building2;
  opportunity: string;
  modeledAssets: string[];
  risk: string;
  brief: string;
  recommendation: string;
  quoteRange: string;
  payback: string;
  roiNote: string;
};

const _telemetryRows: UseCase[] = [
  {
    type: "Hotel",
    location: "Atlanta, GA",
    status: "Optimizing TOU-GS tariff...",
    savings: "$18,400/yr",
    active: true,
    Icon: Hotel,
    opportunity:
      "Peak demand charges, HVAC runtime, laundry loads, and backup resilience often hide the fastest savings path.",
    modeledAssets: [
      "Solar canopy + rooftop PV",
      "Lobby/guest-room load profile",
      "Battery demand-charge dispatch",
    ],
    risk: "High occupancy days can spike demand charges before operators see the bill.",
    brief:
      "MERLIN turns room count, ZIP, tariff, and monthly bill into an owner-ready savings brief.",
    recommendation: "Rooftop/canopy solar + battery demand-charge control",
    quoteRange: "$170K–$240K",
    payback: "5.1–6.4 yrs",
    roiNote: "Prioritize demand-charge reduction before sizing generation.",
  },
  {
    type: "Car Wash",
    location: "Phoenix, AZ",
    status: "Modeling 80 kW solar array...",
    savings: "$9,200/yr",
    active: false,
    Icon: Building2,
    opportunity:
      "Daytime pump, dryer, vacuum, and water-heating loads line up well with solar production.",
    modeledAssets: [
      "PV production curve",
      "Pump and dryer demand profile",
      "Battery peak clipping",
    ],
    risk: "Demand spikes can erase margin on high-volume wash days.",
    brief:
      "MERLIN compares solar-only, solar + storage, and load-control paths before a vendor proposal.",
    recommendation: "Solar-first quote with optional battery peak clipping",
    quoteRange: "$75K–$115K",
    payback: "4.8–6.0 yrs",
    roiNote: "Best fit when daytime volume overlaps solar production.",
  },
  {
    type: "Airport",
    location: "Las Vegas, NV",
    status: "Mapping campus microgrid zones...",
    savings: "$315,000/yr",
    active: false,
    Icon: Plane,
    opportunity:
      "Airports behave like small cities: terminals, concessions, parking, ground support, and critical operations.",
    modeledAssets: ["Campus load segmentation", "Microgrid dispatch", "Critical-load resilience"],
    risk: "Grid constraints and outage exposure can cascade across passenger, vendor, and operations systems.",
    brief:
      "MERLIN frames phased infrastructure decisions before expensive engineering studies begin.",
    recommendation: "Phased campus microgrid and critical-load segmentation",
    quoteRange: "$3.8M–$6.2M",
    payback: "6.5–8.2 yrs",
    roiNote: "Separate resilience value from pure utility-bill savings.",
  },
  {
    type: "EV Charging Hub",
    location: "Riverside, CA",
    status: "Testing demand-control strategy...",
    savings: "$76,500/yr",
    active: false,
    Icon: Zap,
    opportunity:
      "Fast charging creates intense peaks; storage and solar can protect margins and reduce interconnection pressure.",
    modeledAssets: [
      "Charger utilization curve",
      "Battery peak shaving",
      "Solar + grid import blend",
    ],
    risk: "Demand charges and upgrade costs can break a charging hub's unit economics.",
    brief:
      "MERLIN shows whether the site needs storage, load controls, or a different charging mix.",
    recommendation: "Demand-managed fast charging + BESS dispatch",
    quoteRange: "$620K–$1.1M",
    payback: "4.9–6.7 yrs",
    roiNote: "Storage protects utilization upside from peak-demand penalties.",
  },
  {
    type: "Data Center",
    location: "Ashburn, VA",
    status: "Evaluating grid capacity exposure...",
    savings: "$1.4M/yr",
    active: false,
    Icon: DatabaseZap,
    opportunity:
      "Always-on load, utility constraints, and power availability make energy strategy existential for AI infrastructure.",
    modeledAssets: ["24/7 load profile", "On-site generation mix", "Storage and backup resilience"],
    risk: "Power availability, rate-case pressure, and interconnection delays can slow growth.",
    brief:
      "MERLIN helps teams compare grid dependency, on-site energy, and resilience economics by location.",
    recommendation: "On-site generation mix + storage resilience screen",
    quoteRange: "$18M–$42M",
    payback: "5.8–8.0 yrs",
    roiNote: "Treat grid access as a growth constraint, not just a utility line item.",
  },
];

const proofItems = ["Free & Instant", "No Utility Login Required", "CFO-Ready Report"];

const HERO_HEADLINE_ROTATION_MS = 5200;
const HERO_INTAKE_STORAGE_KEY = "merlin_hero_intake_v1";
const HERO_HEADLINE_TYPE_MS = 95;

const heroHeadlines = [
  {
    lead: "Reduce Grid Dependence",
    accent: "Through Energy Stacking.",
  },
  {
    lead: "The Energy OS",
    accent: "For Commercial Buildings.",
  },
  {
    lead: "How Merlin Works:",
    accent: "Energy Stacking in Minutes.",
  },
  {
    lead: "Know What to Build",
    accent: "Before You Call an EPC.",
  },
  {
    lead: "Build on Merlin's",
    accent: "Commercial Energy API Stack.",
  },
];

const heroBusinessTypes: Array<{ label: string; slug: IndustrySlug }> = [
  { label: "Car wash", slug: "car_wash" },
  { label: "Hotel / hospitality", slug: "hotel" },
  { label: "Retail / shopping center", slug: "retail" },
  { label: "Restaurant", slug: "restaurant" },
  { label: "Warehouse / logistics", slug: "warehouse" },
  { label: "Manufacturing", slug: "manufacturing" },
  { label: "Office building", slug: "office" },
  { label: "Healthcare", slug: "hospital" },
  { label: "Data center", slug: "data_center" },
  { label: "EV charging", slug: "ev_charging" },
  { label: "Gas station / truck stop", slug: "gas_station" },
  { label: "College / campus", slug: "college" },
  { label: "Other commercial facility", slug: "other" },
];

function _UseCaseModal({ useCase, onClose }: { useCase: UseCase; onClose: () => void }) {
  const Icon = useCase.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="use-case-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-[#111217] p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.13),transparent_30%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue-500/30 bg-blue-500/12 text-blue-400">
                <Icon size={24} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-blue-400">
                  Sample MERLIN Energy Brief
                </div>
                <h3
                  id="use-case-title"
                  className="mt-1 text-2xl font-black tracking-[-0.03em] text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {useCase.type} quote + ROI preview
                </h3>
                <div className="mt-1 text-sm text-slate-500">
                  Example market: {useCase.location}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:text-white"
              aria-label="Close use case details"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Estimated Savings
              </div>
              <div className="mt-2 text-xl font-black text-blue-400">{useCase.savings}</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                First-Pass Quote Range
              </div>
              <div className="mt-2 text-xl font-black text-white">{useCase.quoteRange}</div>
              <div className="mt-1 text-xs text-slate-500">
                Illustrative installed-cost range before vendor bids.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Payback Window
              </div>
              <div className="mt-2 text-lg font-black text-emerald-300">{useCase.payback}</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Recommended Path
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{useCase.recommendation}</div>
            </div>
          </div>

          <p className="mt-6 text-base leading-7 text-slate-300">{useCase.opportunity}</p>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Primary risk MERLIN checks
            </div>
            <div className="text-sm leading-6 text-slate-300">{useCase.risk}</div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              What MERLIN models
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {useCase.modeledAssets.map((asset) => (
                <div
                  key={asset}
                  className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-sm text-slate-300"
                >
                  {asset}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-400/18 bg-emerald-400/8 p-4 text-sm leading-6 text-slate-300">
            <span className="font-bold text-emerald-300">MERLIN output:</span> {useCase.brief}{" "}
            <span className="text-emerald-200">{useCase.roiNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
const ES_METRICS = [
  { id: "gsi", label: "Grid Stress Index", base: 58, range: 10, suffix: "/100", colorClass: "" },
  { id: "sfs", label: "Stack Fit Score", base: 62, range: 9, suffix: "/100", colorClass: "amber" },
  { id: "dr", label: "Dispatch Readiness", base: 70, range: 8, suffix: "%", colorClass: "green" },
];

const ES_CARDS = [
  {
    rows: [
      {
        icon: "⚡",
        iconBg: "rgba(155,109,255,0.15)",
        name: "Grid Dependence",
        badge: "Pending ZIP",
        badgeBg: "rgba(245,158,11,0.12)",
        badgeColor: "#f59e0b",
        badgeBorder: "rgba(245,158,11,0.25)",
        value: "Baseline",
        valueColor: "#9b6dff",
        desc: "Select ZIP to localize utility exposure and refine stack profile.",
      },
      {
        icon: "📈",
        iconBg: "rgba(245,158,11,0.15)",
        name: "Peak Charge",
        badge: "Active",
        badgeBg: "rgba(52,211,153,0.12)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(52,211,153,0.25)",
        value: "16–24%",
        valueColor: "#f59e0b",
        desc: "Estimated reduction potential · 2–4 hr backup window.",
      },
    ],
    wide: {
      icon: "🏗️",
      iconBg: "rgba(79,138,255,0.15)",
      name: "Recommended Stack Architecture",
      badge: "Optimized",
      badgeBg: "rgba(79,138,255,0.12)",
      badgeColor: "#4f8aff",
      badgeBorder: "rgba(79,138,255,0.25)",
      value: "Solar + BESS + Utility",
      valueColor: "#4f8aff",
      valueFontSize: "18px",
      desc: "Co-optimized across utility, storage, and generation assets.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "💸",
        iconBg: "rgba(248,113,113,0.15)",
        name: "Tariff Exposure",
        badge: "High Risk",
        badgeBg: "rgba(248,113,113,0.12)",
        badgeColor: "#f87171",
        badgeBorder: "rgba(248,113,113,0.25)",
        value: "$0.31/kWh",
        valueColor: "#f87171",
        desc: "TOU peak rate window · 4–9 PM daily exposure detected.",
      },
      {
        icon: "🛡️",
        iconBg: "rgba(52,211,153,0.15)",
        name: "Resilience Score",
        badge: "Strong",
        badgeBg: "rgba(52,211,153,0.12)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(52,211,153,0.25)",
        value: "88/100",
        valueColor: "#34d399",
        desc: "Backup coverage: 6–8 hr critical load window available.",
      },
    ],
    wide: {
      icon: "📊",
      iconBg: "rgba(192,132,252,0.15)",
      name: "Tariff Arbitrage Opportunity",
      badge: "Detected",
      badgeBg: "rgba(155,109,255,0.12)",
      badgeColor: "#c084fc",
      badgeBorder: "rgba(155,109,255,0.25)",
      value: null,
      valueColor: "#c084fc",
      valueFontSize: "22px",
      desc: "Charge during off-peak (12–6 AM) · discharge at TOU peak · est. $420/mo savings.",
      sparkline: [
        "#4f8aff",
        "#6b7fff",
        "#9b6dff",
        "#c084fc",
        "#e879f9",
        "#f59e0b",
        "#fb923c",
        "#34d399",
      ],
    },
  },
  {
    rows: [
      {
        icon: "⚙️",
        iconBg: "rgba(79,138,255,0.15)",
        name: "Load Behavior",
        badge: "Profiled",
        badgeBg: "rgba(79,138,255,0.12)",
        badgeColor: "#4f8aff",
        badgeBorder: "rgba(79,138,255,0.25)",
        value: "142 kW",
        valueColor: "#4f8aff",
        desc: "Peak demand · avg. 94 kW baseline · 51% variance detected.",
      },
      {
        icon: "🕐",
        iconBg: "rgba(52,211,153,0.15)",
        name: "Dispatch Window",
        badge: "Open",
        badgeBg: "rgba(52,211,153,0.12)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(52,211,153,0.25)",
        value: "3.5 hr",
        valueColor: "#34d399",
        desc: "Optimal dispatch: 5–8:30 PM · grid signal aligned.",
      },
    ],
    wide: {
      icon: "🔋",
      iconBg: "rgba(245,158,11,0.15)",
      name: "BESS State of Charge",
      badge: "Charging",
      badgeBg: "rgba(245,158,11,0.12)",
      badgeColor: "#f59e0b",
      badgeBorder: "rgba(245,158,11,0.25)",
      value: "67%",
      valueColor: "#f59e0b",
      valueFontSize: "22px",
      desc: "Target 95% by 4:30 PM · current charge rate 48 kW · ETA 1h 22m.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "📡",
        iconBg: "rgba(155,109,255,0.15)",
        name: "Demand Response",
        badge: "Enrolled",
        badgeBg: "rgba(155,109,255,0.12)",
        badgeColor: "#c084fc",
        badgeBorder: "rgba(155,109,255,0.25)",
        value: "DR-3",
        valueColor: "#9b6dff",
        desc: "Program tier active · next event forecast: Thu 5–7 PM.",
      },
      {
        icon: "🌿",
        iconBg: "rgba(52,211,153,0.15)",
        name: "Carbon Intensity",
        badge: "Low",
        badgeBg: "rgba(52,211,153,0.12)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(52,211,153,0.25)",
        value: "182 g/kWh",
        valueColor: "#34d399",
        desc: "Grid carbon now 38% below daily avg · optimal charge window.",
      },
    ],
    wide: {
      icon: "💰",
      iconBg: "rgba(79,138,255,0.15)",
      name: "Revenue Stack Forecast",
      badge: "Projected",
      badgeBg: "rgba(79,138,255,0.12)",
      badgeColor: "#4f8aff",
      badgeBorder: "rgba(79,138,255,0.25)",
      value: "$1,840/mo",
      valueColor: "#4f8aff",
      valueFontSize: "22px",
      desc: "Demand charge savings $920 · DR incentive $480 · arbitrage $440.",
      sparkline: null,
    },
  },
  {
    rows: [
      {
        icon: "☀️",
        iconBg: "rgba(245,158,11,0.15)",
        name: "Solar Forecast",
        badge: "Today",
        badgeBg: "rgba(245,158,11,0.12)",
        badgeColor: "#f59e0b",
        badgeBorder: "rgba(245,158,11,0.25)",
        value: "312 kWh",
        valueColor: "#f59e0b",
        desc: "Peak generation 11 AM–2 PM · cloud cover 12% · 94% confidence.",
      },
      {
        icon: "⚠️",
        iconBg: "rgba(248,113,113,0.15)",
        name: "Grid Events",
        badge: "Alert",
        badgeBg: "rgba(248,113,113,0.12)",
        badgeColor: "#f87171",
        badgeBorder: "rgba(248,113,113,0.25)",
        value: "2",
        valueColor: "#f87171",
        desc: "Stress events forecast this week · pre-charge strategy recommended.",
      },
    ],
    wide: {
      icon: "🎯",
      iconBg: "rgba(192,132,252,0.15)",
      name: "Stack Optimization Signal",
      badge: "Active",
      badgeBg: "rgba(155,109,255,0.12)",
      badgeColor: "#c084fc",
      badgeBorder: "rgba(155,109,255,0.25)",
      value: "+18% efficiency",
      valueColor: "#c084fc",
      valueFontSize: "22px",
      desc: "Merlin recommends shifting 40 kWh to off-peak · stack reconfigured automatically.",
      sparkline: null,
    },
  },
];

function EsEventItem({
  icon,
  iconBg,
  name,
  badge,
  badgeBg,
  badgeColor,
  badgeBorder,
  value,
  valueColor,
  valueFontSize = "22px",
  desc,
  fullWidth = false,
  sparkline = null,
}: {
  icon: string;
  iconBg: string;
  name: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  value: string | null;
  valueColor: string;
  valueFontSize?: string;
  desc: string;
  fullWidth?: boolean;
  sparkline?: string[] | null;
}) {
  return (
    <div
      style={{
        background: "#111a3e",
        border: "1px solid rgba(99,120,255,0.18)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#8892b0",
            }}
          >
            {name}
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: 20,
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`,
          }}
        >
          {badge}
        </div>
      </div>
      {sparkline ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28, marginTop: 2 }}>
          {sparkline.map((c, i) => (
            <div
              key={i}
              className="es-spark-bar"
              style={{ height: `${[40, 60, 80, 55, 90, 70, 45, 85][i]}%`, background: c }}
            />
          ))}
        </div>
      ) : value ? (
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: valueFontSize,
            fontWeight: 700,
            lineHeight: 1,
            color: valueColor,
          }}
        >
          {value}
        </div>
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

  const [metricVals, setMetricVals] = useState(ES_METRICS.map((m) => m.base + (zipSeed % m.range)));

  // Animate metrics every 7s
  useEffect(() => {
    const t = setInterval(() => {
      setMetricVals(ES_METRICS.map((m) => m.base + Math.floor(Math.random() * m.range)));
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Animate bars every 3s
  useEffect(() => {
    const t = setInterval(() => {
      setBarHeights([0, 0, 0, 0, 0].map(() => Math.floor(Math.random() * 36) + 16));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  function goTo(idx: number) {
    if (idx === activeCard) return;
    setExitCard(activeCard);
    setActiveCard(idx);
    setProgKey((k) => k + 1);
    setTimeout(() => setExitCard(null), 500);
  }

  // Auto-rotate cards every 5s
  useEffect(() => {
    const t = setInterval(() => {
      goTo((activeCard + 1) % ES_CARDS.length);
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard]);

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(99,120,255,0.18)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg,#1a1f4e,#2a1a5e)",
              border: "1px solid rgba(130,100,255,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(155,109,255,0.25)",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#esp-g1)" opacity="0.9" />
              <path
                d="M2 12l10 5 10-5"
                stroke="url(#esp-g2)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="url(#esp-g3)"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.6"
              />
              <defs>
                <linearGradient
                  id="esp-g1"
                  x1="2"
                  y1="2"
                  x2="22"
                  y2="12"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#4f8aff" />
                  <stop offset="100%" stopColor="#9b6dff" />
                </linearGradient>
                <linearGradient
                  id="esp-g2"
                  x1="2"
                  y1="12"
                  x2="22"
                  y2="17"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#9b6dff" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient
                  id="esp-g3"
                  x1="2"
                  y1="17"
                  x2="22"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#4f8aff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.01em",
                color: "#e8eaf6",
                lineHeight: 1.2,
              }}
            >
              Energy Stacking
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9b6dff",
                marginTop: 2,
              }}
            >
              Signal Intelligence™
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(79,138,255,0.1)",
            border: "1px solid rgba(79,138,255,0.25)",
            borderRadius: 20,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#4f8aff",
            textTransform: "uppercase",
          }}
        >
          <div className="es-live-dot" />
          Live Feed
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          background: "rgba(99,120,255,0.18)",
          borderBottom: "1px solid rgba(99,120,255,0.18)",
        }}
      >
        {ES_METRICS.map((m, i) => (
          <div
            key={m.id}
            style={{
              background: "#0d1230",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              cursor: "default",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#111a3e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#0d1230";
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#4a5568",
              }}
            >
              {m.label}
            </div>
            <div
              className={`es-metric-val${m.colorClass ? ` ${m.colorClass}` : ""}`}
              style={{ transition: "all 0.5s ease" }}
            >
              {metricVals[i]}
              <span style={{ fontSize: 14, opacity: 0.6 }}>{m.suffix}</span>
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#4a5568",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
              Baseline
            </div>
          </div>
        ))}
      </div>

      {/* Chart Strip */}
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          borderBottom: "1px solid rgba(99,120,255,0.18)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div style={{ flex: 1, fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
          <strong style={{ color: "#e8eaf6" }}>Merlin</strong> translates load behavior, tariff
          variability, and resilience constraints into one orchestrated stack strategy with
          measurable operating signals.
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52, flexShrink: 0 }}>
          {barHeights.map((h, i) => (
            <div key={i} className="es-bar" style={{ height: h, background: barColors[i] }} />
          ))}
        </div>
      </div>

      {/* Feed Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px 10px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#4a5568",
          }}
        >
          Live Event Variables
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 80,
              height: 2,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div key={progKey} className="es-prog-fill" />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#4a5568" }}>
            {activeCard + 1} / {ES_CARDS.length}
          </div>
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
      <div
        style={{
          fontSize: 10,
          color: "#4a5568",
          textAlign: "center",
          padding: "0 24px 8px",
          letterSpacing: "0.06em",
        }}
      >
        Auto-rotating every 5s · click dots to navigate
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 24px",
          borderTop: "1px solid rgba(99,120,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div
          style={{ fontSize: 11, color: "#4a5568", display: "flex", alignItems: "center", gap: 6 }}
        >
          {modelPreview.zip.length === 5 ? (
            <>
              Localized to ZIP{" "}
              <span style={{ color: "#9b6dff", fontWeight: 600 }}>{modelPreview.zip}</span>
            </>
          ) : (
            <>
              Showing baseline signals ·{" "}
              <span style={{ color: "#9b6dff", fontWeight: 600, cursor: "pointer" }}>
                Add ZIP to localize
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="es-btn es-btn-ghost" type="button">
            Export
          </button>
          <button
            className="es-btn es-btn-primary"
            type="button"
            onClick={() => {
              window.location.href = "/wizard";
            }}
          >
            Add ZIP →
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroIntakeCard() {
  const [zip, setZip] = useState("");
  const [businessType, setBusinessType] = useState<IndustrySlug | "">("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [hasZipStarted, setHasZipStarted] = useState(false);
  const [error, setError] = useState("");

  const normalizedZip = zip.replace(/\D/g, "").slice(0, 5);
  const selectedTypeLabel =
    heroBusinessTypes.find((type) => type.slug === businessType)?.label ?? "commercial facility";
  const canContinue = normalizedZip.length === 5 && businessType;

  const beginDetails = () => {
    if (normalizedZip.length !== 5) {
      setError("Enter a 5-digit facility ZIP code to begin stacking.");
      return;
    }

    setError("");
    setHasZipStarted(true);
  };

  const launchWizard = () => {
    if (!canContinue) {
      setError("Add your ZIP code and business type so Merlin can open the right Step 3 profile.");
      return;
    }

    const draft = {
      source: "hero-stacking-cta",
      zip: normalizedZip,
      industry: businessType,
      businessTypeLabel: selectedTypeLabel,
      businessName: businessName.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem(HERO_INTAKE_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // If storage is blocked, the query string still carries the essential routing context.
    }

    const query = new URLSearchParams({
      source: "hero-stacking-cta",
      zip: normalizedZip,
      industry: businessType,
    });

    window.location.href = `/wizard?${query.toString()}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0a0c18]/90 p-3.5 backdrop-blur-sm sm:p-4">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(62,207,142,0.72),rgba(63,232,255,0.58),rgba(168,85,247,0.52))]" />
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(62,207,142,0.075),rgba(88,28,135,0.12)_48%,rgba(96,165,250,0.075))]" />
        <div className="relative">
          <h2
            className="max-w-[430px] text-[1.55rem] font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-[1.82rem]"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
          >
            Enter your ZIP code to begin stacking.
          </h2>
          <p className="mt-2.5 max-w-md text-[13px] leading-5 text-slate-400">
            Merlin opens the right Step 3 profile from your location and facility type.
          </p>

          <div className="mt-4 grid gap-2">
            <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Facility ZIP Code
            </label>
            <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-1.5 transition focus-within:border-cyan-300/55 focus-within:ring-2 focus-within:ring-cyan-300/10">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-300/12 bg-emerald-300/[0.08] text-emerald-300">
                <MapPin size={16} />
              </div>
              <input
                value={zip}
                onChange={(event) => {
                  setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (hasZipStarted) {
                      launchWizard();
                    } else {
                      beginDetails();
                    }
                  }
                }}
                inputMode="numeric"
                maxLength={5}
                placeholder="89101"
                className="min-w-0 flex-1 bg-transparent text-base font-black tracking-[0.18em] text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {hasZipStarted && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="grid gap-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Business type
                  </label>
                  <select
                    value={businessType}
                    onChange={(event) => {
                      setBusinessType(event.target.value as IndustrySlug);
                      setError("");
                    }}
                    className="h-10 rounded-lg border border-white/10 bg-[#0c1321] px-3 text-sm font-bold text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                  >
                    <option value="">Select facility type</option>
                    {heroBusinessTypes.map((type) => (
                      <option key={type.slug} value={type.slug}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Business name{" "}
                      <span className="font-medium normal-case tracking-normal">optional</span>
                    </label>
                    <input
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Acme Hotel"
                      className="h-10 rounded-lg border border-white/10 bg-[#0c1321] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Address{" "}
                      <span className="font-medium normal-case tracking-normal">optional</span>
                    </label>
                    <input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street address"
                      className="h-10 rounded-lg border border-white/10 bg-[#0c1321] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={hasZipStarted ? launchWizard : beginDetails}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200/25 bg-[linear-gradient(135deg,#3ECF8E_0%,#7DD3FC_62%,#A78BFA_125%)] px-4 py-3 text-sm font-black text-[#04110c] transition hover:bg-[linear-gradient(135deg,#63E6A7_0%,#93C5FD_62%,#C4B5FD_125%)]"
          >
            {hasZipStarted ? "Continue to Step 3" : "Begin Stacking"} <ArrowRight size={18} />
          </button>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-[10px] font-bold text-slate-400">
            <span>ZIP → type → Step 3</span>
            <span className="text-emerald-300">No utility login</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const [activeHeadlineIndex, setActiveHeadlineIndex] = useState(0);
  const [typedAccent, setTypedAccent] = useState("");

  const activeHeadline = heroHeadlines[activeHeadlineIndex];

  useEffect(() => {
    const rotationTimer = window.setInterval(() => {
      setActiveHeadlineIndex((currentIndex) => (currentIndex + 1) % heroHeadlines.length);
    }, HERO_HEADLINE_ROTATION_MS);

    return () => window.clearInterval(rotationTimer);
  }, []);

  useEffect(() => {
    setTypedAccent("");
    let characterIndex = 0;
    const typeTimer = window.setInterval(() => {
      characterIndex += 1;
      setTypedAccent(activeHeadline.accent.slice(0, characterIndex));

      if (characterIndex >= activeHeadline.accent.length) {
        window.clearInterval(typeTimer);
      }
    }, HERO_HEADLINE_TYPE_MS);

    return () => window.clearInterval(typeTimer);
  }, [activeHeadline.accent]);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#050608] pt-20 text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(128,90,213,0.07)_1px,transparent_1px),linear-gradient(rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_62%,rgba(168,85,247,0.13),transparent_28%),radial-gradient(circle_at_74%_36%,rgba(99,102,241,0.10),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_0.74fr] lg:px-8 xl:px-12">
        <div className="max-w-3xl">
          <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-[12px] font-medium tracking-[0.12em] text-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
            <Sparkles size={13} className="text-purple-400" /> Independent B2B Energy Intelligence
          </div>

          <h1
            className="max-w-[820px] text-5xl font-black leading-[0.96] tracking-[-0.045em] text-white antialiased sm:text-6xl lg:text-[4.35rem] xl:text-[4.85rem]"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              textShadow: "0 1px 0 rgba(255,255,255,0.08), 0 14px 36px rgba(2,6,23,0.42)",
            }}
          >
            <span key={activeHeadline.lead} className="merlin-hero-headline-fade inline-block">
              {activeHeadline.lead}{" "}
            </span>
            <br />
            <span
              key={activeHeadline.accent}
              className="merlin-hero-headline-fade merlin-hero-type-line text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #3FE8FF 0%, #22D3EE 35%, #A855F7 70%, #C084FC 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 10px 28px rgba(34,211,238,0.22)",
              }}
            >
              {typedAccent || activeHeadline.accent.slice(0, 1)}
            </span>
          </h1>

          <p
            className="mt-7 max-w-2xl text-lg leading-8 text-slate-400"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            Merlin uses <span className="font-semibold text-slate-200">Energy Stacking™</span> to
            orchestrate utility, battery, solar, generator, and AI load optimization into one
            decision-ready infrastructure strategy.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
            {proofItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 size={15} className="text-blue-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <HeroIntakeCard />
      </div>

      <style>{`
        @keyframes merlinHeroHeadlineFade {
          0%, 100% { opacity: 0.88; transform: translateY(0); }
          8%, 86% { opacity: 1; transform: translateY(0); }
          94% { opacity: 0.72; transform: translateY(-3px); }
        }

        @keyframes merlinAgentSignal {
          0%, 100% { opacity: 0.34; transform: scale(0.96); }
          50% { opacity: 0.72; transform: scale(1.06); }
        }

        .merlin-agent-signal {
          animation: merlinAgentSignal 4.8s ease-in-out infinite;
        }

        .merlin-hero-headline-fade {
          animation: merlinHeroHeadlineFade 5.2s ease-in-out infinite;
        }

        .merlin-hero-type-line::after {
          content: "";
          display: inline-block;
          width: 0.08em;
          height: 0.82em;
          margin-left: 0.08em;
          border-radius: 999px;
          background: rgba(192, 132, 252, 0.85);
          box-shadow: 0 0 18px rgba(63, 232, 255, 0.45);
          transform: translateY(0.08em);
        }

        @media (prefers-reduced-motion: reduce) {
          .merlin-hero-headline-fade {
            animation: none;
          }

          .merlin-hero-type-line::after {
            display: none;
          }

          .merlin-agent-signal {
            animation: none;
            opacity: 0.36;
          }
        }
      `}</style>
    </section>
  );
}
