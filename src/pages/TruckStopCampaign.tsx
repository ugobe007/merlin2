import React, { useState } from "react";
import { MiniWizardV8 } from "@/wizard/v8/MiniWizardV8";
import ScheduleDemoModal from "@/components/modals/ScheduleDemoModal";

// ========================================
// CAMPAIGN CONFIGURATION
// ========================================
// TO CUSTOMIZE FOR A NEW TRUCK STOP:
// 1. Copy a config object below
// 2. Update numbers, company name, locations, etc.
// 3. Pass it as the config prop or create a new route
// ========================================

interface TruckStopCampaignConfig {
  companyName: string;
  companyTagline: string;

  heroTitle: string;
  heroSubtitle: string;
  heroHighlight: string;

  portfolioMetrics: {
    totalInvestment: string;
    investmentNote: string;
    annualSavings: string;
    savingsNote: string;
    payback: string;
    paybackNote: string;
    roi: string;
    roiNote: string;
  } | null;

  featuredLocation: {
    name: string;
    annualSavings: string;
    demandCharges: string;
    energyArbitrage: string;
    roi: string;
    payback: string;
    irr: string;
    investment: string;
    npv: string;
    netGain: string;
    peakLoad: string;
    solarSize: string;
    solarCoverage: string;
    batteryEnergy: string;
    batteryPower: string;
    duration: string;
    reefer: string;
  };

  investmentBreakdown: {
    battery: string;
    solar: string;
    balance: string;
    labor: string;
  };

  valueProps: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  whyThisCompany: {
    title: string;
    reasons: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };

  locations: Array<{
    city: string;
    peak: string;
    investment: string;
    savings: string;
    payback: string;
    irr: string;
  }> | null;

  scenarios: Array<{
    name: string;
    investment: string;
    savings: string;
    payback: string;
    roi: string;
    note: string;
    highlight?: boolean;
  }> | null;

  emailSubject: string;
  emailBody: string;
  downloadQuoteUrl?: string;
}

// ========================================
// PILOT TRAVEL CENTERS CONFIG (DEFAULT EXAMPLE)
// ========================================
const PILOT_TRAVEL_CONFIG: TruckStopCampaignConfig = {
  companyName: "Pilot Travel Centers",
  companyTagline: "America's Largest Truck Stop Chain — Going Solar",
  heroTitle: "Zero-Bill Energy for",
  heroSubtitle:
    "Solar + battery transformation for high-throughput travel centers: $3.2M investment → $285K/year savings → 6.2yr payback at a single Pilot flagship location",
  heroHighlight: "TRUCK STOP ENERGY TRANSFORMATION",

  portfolioMetrics: {
    totalInvestment: "$3.2M",
    investmentNote: "Flagship Site",
    annualSavings: "$285K",
    savingsNote: "Year 1",
    payback: "6.2yr",
    paybackNote: "Simple Payback",
    roi: "125%",
    roiNote: "10-Year Base Case",
  },

  featuredLocation: {
    name: "I-40 Flagship Travel Center",
    annualSavings: "$285K",
    demandCharges: "$198K",
    energyArbitrage: "$87K",
    roi: "125%",
    payback: "6.2 years",
    irr: "18.2%",
    investment: "$3.2M",
    npv: "$4.9M",
    netGain: "$1.7M",
    peakLoad: "2,400 kW",
    solarSize: "1,200 kW",
    solarCoverage: "50% coverage",
    batteryEnergy: "600 kWh",
    batteryPower: "800 kW power",
    duration: "0.75 hrs",
    reefer: "80 shore-power spots",
  },

  investmentBreakdown: {
    battery: "$640,000",
    solar: "$1,560,000",
    balance: "$480,000",
    labor: "$520,000",
  },

  valueProps: [
    {
      icon: "⚡",
      title: "Demand Charge Demolition",
      description:
        "BESS shaves peak demand spikes from fuel island + kitchen + showers — cuts utility bill by ~$198K/yr",
    },
    {
      icon: "🌞",
      title: "Massive Canopy Real Estate",
      description:
        "Truck parking canopies + rooftop = 1.2 MW solar — no modifications to operations, pure margin lift",
    },
    {
      icon: "🔌",
      title: "Reefer Shore Power Revenue",
      description:
        "80 plug-in spots @ $0.50/kWh overnight — $25K-$60K new annual revenue from Class 8 fleets",
    },
    {
      icon: "🛡️",
      title: "Backup Power for Critical Systems",
      description:
        "Fuel pumps, POS systems, and driver showers stay on during grid outages — zero revenue loss",
    },
  ],

  whyThisCompany: {
    title: "Why Truck Stops Are the Perfect Solar Target",
    reasons: [
      {
        icon: "🏭",
        title: "Highest Energy Density of Any Vertical",
        description:
          "24/7 operations: fuel island, kitchen, showers, HVAC, lighting, reefer — 2,400+ kW peak, every single day",
      },
      {
        icon: "🚛",
        title: "EV Fleet Tailwind",
        description:
          "Class 8 EV trucks (Tesla Semi, Freightliner eCascadia) need 350 kW DCFC — early movers capture fleet contracts",
      },
      {
        icon: "💰",
        title: "ITC + MACRS + Bonus Depreciation",
        description:
          "30% ITC + 100% bonus depreciation in year 1 = effective 50%+ subsidy on installed cost",
      },
    ],
  },

  locations: [
    {
      city: "Amarillo, TX",
      peak: "2,400 kW",
      investment: "$3.2M",
      savings: "$285K",
      payback: "6.2yr",
      irr: "18.2%",
    },
    {
      city: "Kingman, AZ",
      peak: "2,100 kW",
      investment: "$2.9M",
      savings: "$248K",
      payback: "6.5yr",
      irr: "17.8%",
    },
    {
      city: "Barstow, CA",
      peak: "2,600 kW",
      investment: "$3.5M",
      savings: "$340K",
      payback: "5.8yr",
      irr: "19.1%",
    },
    {
      city: "Laramie, WY",
      peak: "1,900 kW",
      investment: "$2.6M",
      savings: "$210K",
      payback: "6.8yr",
      irr: "17.1%",
    },
    {
      city: "Effingham, IL",
      peak: "2,200 kW",
      investment: "$3.0M",
      savings: "$255K",
      payback: "6.3yr",
      irr: "17.9%",
    },
  ],

  scenarios: [
    {
      name: "Solar Only",
      investment: "$1.56M",
      savings: "$112K",
      payback: "13.9yr",
      roi: "44%",
      note: "Lowest cost entry",
    },
    {
      name: "Solar + BESS",
      investment: "$3.2M",
      savings: "$285K",
      payback: "6.2yr",
      roi: "125%",
      note: "✅ Recommended",
      highlight: true,
    },
    {
      name: "Solar + BESS + Reefer",
      investment: "$3.5M",
      savings: "$325K",
      payback: "6.0yr",
      roi: "132%",
      note: "New revenue stream",
    },
    {
      name: "Solar + BESS + DCFC",
      investment: "$4.2M",
      savings: "$390K",
      payback: "6.5yr",
      roi: "140%",
      note: "EV fleet ready",
    },
    {
      name: "Complete Package",
      investment: "$5.1M",
      savings: "$450K",
      payback: "6.8yr",
      roi: "148%",
      note: "Flagship showcase",
    },
  ],

  emailSubject: "Truck Stop Energy Transformation Inquiry",
  emailBody:
    "I'd like to discuss solar + battery solutions for our truck stop / travel center. Please contact me to schedule a demo.",
};

// ========================================
// GENERIC TRUCK STOP TEMPLATE CONFIG
// ========================================
export const GENERIC_TRUCK_STOP_CONFIG: TruckStopCampaignConfig = {
  companyName: "[Your Travel Center Name]",
  companyTagline: "Sustainable Truck Stop Solutions",
  heroTitle: "Zero-Bill Energy for",
  heroSubtitle:
    "Solar + battery solutions for travel centers: cut energy costs, add reefer revenue, and future-proof for Class 8 EV fleets",
  heroHighlight: "TRUCK STOP ENERGY TRANSFORMATION",
  portfolioMetrics: null,
  featuredLocation: {
    name: "Your Location",
    annualSavings: "$XXX,XXX",
    demandCharges: "$XXX,XXX",
    energyArbitrage: "$XX,XXX",
    roi: "XXX%",
    payback: "X.X years",
    irr: "XX.X%",
    investment: "$X.XM",
    npv: "$X.XM",
    netGain: "$X.XM",
    peakLoad: "X,XXX kW",
    solarSize: "X,XXX kW",
    solarCoverage: "XX% coverage",
    batteryEnergy: "XXX kWh",
    batteryPower: "XXX kW power",
    duration: "X.X hrs",
    reefer: "XX shore-power spots",
  },
  investmentBreakdown: {
    battery: "$X,XXX,000",
    solar: "$X,XXX,000",
    balance: "$XXX,000",
    labor: "$XXX,000",
  },
  valueProps: [
    {
      icon: "⚡",
      title: "Demand Charge Demolition",
      description: "BESS shaves peak spikes from fuel island + kitchen + showers",
    },
    {
      icon: "🌞",
      title: "Solar on Truck Canopies",
      description: "Largest solar real estate of any commercial vertical",
    },
    {
      icon: "🔌",
      title: "Reefer Shore Power Revenue",
      description: "New revenue from Class 8 trucks parking overnight",
    },
    {
      icon: "🛡️",
      title: "Backup for Critical Systems",
      description: "Fuel pumps, POS, and showers stay on during outages",
    },
  ],
  whyThisCompany: {
    title: "Why Truck Stops Are the Perfect Solar Target",
    reasons: [
      {
        icon: "🏭",
        title: "Highest Energy Density",
        description:
          "24/7 operations: fuel island, kitchen, showers, reefer — massive loads every day",
      },
      {
        icon: "🚛",
        title: "EV Fleet Tailwind",
        description: "Class 8 EVs need 350 kW DCFC — early movers lock in fleet contracts",
      },
      {
        icon: "💰",
        title: "ITC + MACRS = 50%+ Subsidy",
        description: "30% ITC + bonus depreciation dramatically reduces net cost",
      },
    ],
  },
  locations: null,
  scenarios: null,
  emailSubject: "Truck Stop Energy Inquiry",
  emailBody: "I'd like to learn more about solar + battery solutions for my truck stop.",
};

// ========================================
// COMPONENT
// ========================================

interface TruckStopCampaignProps {
  config?: TruckStopCampaignConfig;
}

export default function TruckStopCampaign({
  config = PILOT_TRAVEL_CONFIG,
}: TruckStopCampaignProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  if (showWizard) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", position: "relative" }}>
        <button
          onClick={() => setShowWizard(false)}
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 9999,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(8,11,20,0.85)",
            backdropFilter: "blur(12px)",
            color: "rgba(255,255,255,0.65)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(251,191,36,0.35)";
            e.currentTarget.style.color = "#FBBF24";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "rgba(255,255,255,0.65)";
          }}
        >
          ← Back to Campaign
        </button>
        <MiniWizardV8 industry="truck-stop" companyName={config.companyName} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #1a1000 0%, #0a0800 60%, #1a0f00 100%)" }}
    >
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: "rgba(10,8,0,0.88)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(251,191,36,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-amber-400">⛽ Merlin Energy</span>
              <span className="text-[11px] text-slate-500 font-mono border-l border-white/10 pl-4 hidden sm:block">
                Truck Stop Vertical
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="text-slate-400 hover:text-white transition text-sm">
                Home
              </a>
              <a href="/wizard-v8" className="text-slate-400 hover:text-white transition text-sm">
                Quote Tool
              </a>
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #FBBF24, #D97706)", color: "#000" }}
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.30)",
              }}
            >
              <span className="text-amber-400 text-sm font-semibold">
                🚛 {config.heroHighlight}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {config.heroTitle}
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #FBBF24, #F97316)",
                }}
              >
                {config.companyTagline}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">{config.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-8 py-4 text-lg font-semibold rounded-lg transition-all"
                style={{
                  background: "transparent",
                  border: "2px solid #FBBF24",
                  color: "#FBBF24",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FDE68A")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#FBBF24")}
              >
                📅 Schedule Demo
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="px-12 py-5 text-2xl font-black rounded-xl transition-all transform hover:scale-105"
                style={{
                  background: "transparent",
                  border: "3px solid #F97316",
                  color: "#FB923C",
                  boxShadow: "0 0 30px rgba(249,115,22,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FDBA74";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(249,115,22,0.30)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#F97316";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(249,115,22,0.15)";
                }}
              >
                📊 Get Your Live Quote
              </button>
            </div>
          </div>

          {/* Portfolio Metrics */}
          {config.portfolioMetrics && (
            <div className="grid md:grid-cols-4 gap-6 mb-20">
              {[
                {
                  label: "Total Investment",
                  value: config.portfolioMetrics.totalInvestment,
                  note: config.portfolioMetrics.investmentNote,
                  color: "#FBBF24",
                },
                {
                  label: "Annual Savings",
                  value: config.portfolioMetrics.annualSavings,
                  note: config.portfolioMetrics.savingsNote,
                  color: "#60A5FA",
                },
                {
                  label: "Avg Payback",
                  value: config.portfolioMetrics.payback,
                  note: config.portfolioMetrics.paybackNote,
                  color: "#C084FC",
                },
                {
                  label: "10-Year ROI",
                  value: config.portfolioMetrics.roi,
                  note: config.portfolioMetrics.roiNote,
                  color: "#FB923C",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="backdrop-blur rounded-xl p-6 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="text-4xl font-bold mb-2" style={{ color: m.color }}>
                    {m.value}
                  </div>
                  <div className="text-gray-300">{m.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{m.note}</div>
                </div>
              ))}
            </div>
          )}

          {/* Featured Location */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center px-5 py-2 rounded-full mb-6"
                style={{ border: "2px solid #FBBF24" }}
              >
                <span className="text-amber-400 text-sm font-bold tracking-wide">
                  LIVE QUOTE EXAMPLE
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {config.featuredLocation.name}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Real numbers. Real savings. No smoke and mirrors.
              </p>
            </div>

            {/* Hero Numbers */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Annual Savings */}
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/15 blur-xl group-hover:blur-2xl transition-all rounded-2xl" />
                <div
                  className="relative rounded-2xl p-8 text-center transition-all"
                  style={{
                    background: "rgba(8,8,0,0.90)",
                    backdropFilter: "blur(16px)",
                    border: "3px solid #FBBF24",
                  }}
                >
                  <div className="text-sm font-bold text-amber-400 tracking-wider mb-2">
                    ANNUAL SAVINGS
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2">
                    {config.featuredLocation.annualSavings}
                  </div>
                  <div className="text-lg text-amber-300 font-semibold mb-3">/year guaranteed</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-3" />
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Demand charges:{" "}
                      <span className="text-amber-300">
                        {config.featuredLocation.demandCharges}
                      </span>
                    </div>
                    <div>
                      Energy arbitrage:{" "}
                      <span className="text-amber-300">
                        {config.featuredLocation.energyArbitrage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="relative group">
                <div className="absolute inset-0 bg-orange-500/15 blur-xl group-hover:blur-2xl transition-all rounded-2xl" />
                <div
                  className="relative rounded-2xl p-8 text-center transition-all"
                  style={{
                    background: "rgba(8,8,0,0.90)",
                    backdropFilter: "blur(16px)",
                    border: "3px solid #F97316",
                  }}
                >
                  <div className="text-sm font-bold text-orange-400 tracking-wider mb-2">
                    10-YEAR ROI
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2">
                    {config.featuredLocation.roi}
                  </div>
                  <div className="text-lg text-orange-300 font-semibold mb-3">above break-even</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mb-3" />
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Payback:{" "}
                      <span className="text-orange-300">{config.featuredLocation.payback}</span>
                    </div>
                    <div>
                      IRR: <span className="text-orange-300">{config.featuredLocation.irr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment */}
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-500/10 blur-xl group-hover:blur-2xl transition-all rounded-2xl" />
                <div
                  className="relative rounded-2xl p-8 text-center transition-all"
                  style={{
                    background: "rgba(8,8,0,0.90)",
                    backdropFilter: "blur(16px)",
                    border: "3px solid #EAB308",
                  }}
                >
                  <div className="text-sm font-bold text-yellow-400 tracking-wider mb-2">
                    TOTAL INVESTMENT
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2">
                    {config.featuredLocation.investment}
                  </div>
                  <div className="text-lg text-yellow-300 font-semibold mb-3">
                    turnkey installed
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mb-3" />
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      25-yr NPV:{" "}
                      <span className="text-yellow-300">{config.featuredLocation.npv}</span>
                    </div>
                    <div>
                      Net gain:{" "}
                      <span className="text-yellow-300">{config.featuredLocation.netGain}</span>
                    </div>
                  </div>
                  <div
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(234,179,8,0.12)",
                      border: "1px solid rgba(234,179,8,0.30)",
                      color: "#FDE68A",
                    }}
                  >
                    30% ITC reduces net cost by ~$960K
                  </div>
                </div>
              </div>
            </div>

            {/* System Config + Value Props */}
            <div
              className="border rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              {/* System Configuration */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-amber-400 mr-3">⚡</span>
                  System Configuration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Peak Load", val: config.featuredLocation.peakLoad, color: "#FBBF24" },
                    {
                      label: "Solar",
                      val: config.featuredLocation.solarSize,
                      sub: config.featuredLocation.solarCoverage,
                      color: "#60A5FA",
                    },
                    {
                      label: "Battery",
                      val: config.featuredLocation.batteryEnergy,
                      sub: config.featuredLocation.batteryPower,
                      color: "#FB923C",
                    },
                    { label: "Duration", val: config.featuredLocation.duration, color: "#A78BFA" },
                    {
                      label: "Reefer Spots",
                      val: config.featuredLocation.reefer,
                      color: "#34D399",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl p-4 text-center transition-all hover:border-amber-400/50"
                      style={{ border: "2px solid rgba(255,255,255,0.10)" }}
                    >
                      <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                      <div className="text-xl font-bold" style={{ color: item.color }}>
                        {item.val}
                      </div>
                      {item.sub && <div className="text-xs text-gray-500 mt-1">{item.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="p-8 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-amber-400 mr-3">💰</span>
                  Investment Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Battery Storage System",
                      val: config.investmentBreakdown.battery,
                      color: "#FB923C",
                    },
                    {
                      label: "Solar Canopy Installation",
                      val: config.investmentBreakdown.solar,
                      color: "#60A5FA",
                    },
                    {
                      label: "Balance of System",
                      val: config.investmentBreakdown.balance,
                      color: "#FBBF24",
                    },
                    {
                      label: "EPC & Installation Labor",
                      val: config.investmentBreakdown.labor,
                      color: "#34D399",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center py-3 px-4 rounded-xl transition-all"
                      style={{ border: "2px solid rgba(255,255,255,0.08)" }}
                    >
                      <span className="text-gray-300 font-medium">{item.label}</span>
                      <span className="font-bold text-xl" style={{ color: item.color }}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Props */}
              <div className="p-8 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-orange-400 mr-3">🌟</span>
                  Why This Works for Truck Stops
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {config.valueProps.map((prop, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 p-4 rounded-xl transition-all"
                      style={{ border: "2px solid rgba(255,255,255,0.08)" }}
                    >
                      <span className="text-2xl">{prop.icon}</span>
                      <div>
                        <div className="text-white font-bold mb-1">{prop.title}</div>
                        <div className="text-gray-400 text-sm">{prop.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Footer */}
              <div
                className="px-8 py-6 border-t"
                style={{ background: "rgba(0,0,0,0.40)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-gray-400">
                    <span className="text-amber-400 font-semibold">TrueQuote™</span> verified
                    pricing • 25-year warranty • Valid 90 days
                  </div>
                  <div className="flex gap-3">
                    {config.downloadQuoteUrl && (
                      <button
                        onClick={() => window.open(config.downloadQuoteUrl, "_blank")}
                        className="px-6 py-3 rounded-lg font-bold transition-all"
                        style={{ border: "2px solid #60A5FA", color: "#60A5FA" }}
                      >
                        Download Full Quote
                      </button>
                    )}
                    <button
                      onClick={() =>
                        window.open(
                          `mailto:sales@merlinenergy.net?subject=${encodeURIComponent(config.emailSubject)}&body=${encodeURIComponent(config.emailBody)}`,
                          "_blank"
                        )
                      }
                      className="px-6 py-3 rounded-lg font-bold transition-all"
                      style={{ border: "2px solid #FBBF24", color: "#FBBF24" }}
                    >
                      Request Custom Quote →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why This Company */}
          <div
            className="rounded-2xl p-12 mb-20"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(249,115,22,0.04) 100%)",
              border: "1px solid rgba(251,191,36,0.15)",
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🎯 {config.whyThisCompany.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {config.whyThisCompany.reasons.map((reason, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl mb-4">{reason.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{reason.title}</h3>
                  <p className="text-gray-300">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Multiple Locations */}
          {config.locations && (
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                📍 {config.locations.length} Locations Ready for Transformation
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {config.locations.map((site) => (
                  <div
                    key={site.city}
                    className="backdrop-blur rounded-xl p-5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="text-lg font-bold text-white mb-3">{site.city}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peak Load</span>
                        <span className="text-gray-200 font-semibold">{site.peak}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Investment</span>
                        <span className="text-amber-400 font-semibold">{site.investment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Annual Savings</span>
                        <span className="text-blue-400 font-semibold">{site.savings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payback</span>
                        <span className="text-purple-400 font-semibold">{site.payback}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">IRR</span>
                        <span className="text-orange-400 font-semibold">{site.irr}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenarios */}
          {config.scenarios && (
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                🚀 Scenario Analysis: {config.featuredLocation.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {config.scenarios.map((scenario) => (
                  <div
                    key={scenario.name}
                    className="backdrop-blur rounded-xl p-5"
                    style={{
                      background: scenario.highlight
                        ? "rgba(251,191,36,0.08)"
                        : "rgba(255,255,255,0.04)",
                      border: scenario.highlight
                        ? "2px solid rgba(251,191,36,0.50)"
                        : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: scenario.highlight ? "0 0 24px rgba(251,191,36,0.12)" : "none",
                    }}
                  >
                    <div className="text-sm font-semibold text-gray-400 mb-1">{scenario.note}</div>
                    <div className="text-lg font-bold text-white mb-3">{scenario.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Investment</span>
                        <span className="text-amber-400 font-semibold">{scenario.investment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Annual</span>
                        <span className="text-blue-400 font-semibold">{scenario.savings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payback</span>
                        <span className="text-purple-400 font-semibold">{scenario.payback}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">10yr ROI</span>
                        <span className="text-orange-400 font-semibold">{scenario.roi}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final CTA */}
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(249,115,22,0.06) 100%)",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform {config.companyName}?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get a custom quote, schedule a demo, or explore detailed financial projections for
              your travel center.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-8 py-4 text-lg font-semibold rounded-lg transition shadow-lg"
                style={{ background: "linear-gradient(135deg, #FBBF24, #D97706)", color: "#000" }}
              >
                📅 Schedule Demo
              </button>
              {config.downloadQuoteUrl && (
                <button
                  onClick={() => window.open(config.downloadQuoteUrl, "_blank")}
                  className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-100 transition"
                >
                  📊 Download Quote
                </button>
              )}
              <button
                onClick={() => setShowWizard(true)}
                className="px-8 py-4 text-lg font-semibold rounded-lg transition"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                🧮 Try Quote Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-12 px-4" style={{ borderColor: "rgba(255,255,255,0.09)" }}>
        <div className="max-w-7xl mx-auto text-center" style={{ color: "#64748B" }}>
          <p className="mb-4">⛽ Merlin Energy — Truck Stop Energy Transformation</p>
          <p className="text-sm">
            Campaign: {config.companyName} |{" "}
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            <br />
            For inquiries:{" "}
            <a href="mailto:sales@merlinenergy.net" className="text-amber-400 hover:text-amber-300">
              sales@merlinenergy.net
            </a>
          </p>
        </div>
      </div>

      <ScheduleDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  );
}

export { PILOT_TRAVEL_CONFIG };
export type { TruckStopCampaignConfig };
