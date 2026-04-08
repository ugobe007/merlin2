import React, { useState, useEffect } from "react";
import { MiniWizardV8 } from "@/wizard/v8/MiniWizardV8";
import ScheduleDemoModal from "@/components/modals/ScheduleDemoModal";
import { ElCarWashLogo } from "@/components/logos/ElCarWashLogo";

// ========================================
// CAMPAIGN CONFIGURATION
// ========================================
// TO CUSTOMIZE FOR A NEW CAR WASH:
// 1. Copy this entire config object
// 2. Update company name, locations, metrics, etc.
// 3. Either update this file or create new route with different config
// ========================================

interface CampaignConfig {
  // Company Info
  companyName: string;
  companyTagline: string;
  industry: "car_wash";

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroHighlight: string;

  // Portfolio Metrics (optional - set to null to hide)
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

  // Featured Location Example
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
    backupTime: string;
  };

  // Investment Breakdown
  investmentBreakdown: {
    battery: string;
    solar: string;
    balance: string;
    labor: string;
  };

  // Value Props
  valueProps: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  // Why This Company Section
  whyThisCompany: {
    title: string;
    reasons: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };

  // Multiple Locations (optional)
  locations: Array<{
    city: string;
    peak: string;
    investment: string;
    savings: string;
    payback: string;
    irr: string;
  }> | null;

  // Scenarios (optional)
  scenarios: Array<{
    name: string;
    investment: string;
    savings: string;
    payback: string;
    roi: string;
    note: string;
    highlight?: boolean;
  }> | null;

  // CTAs
  emailSubject: string;
  emailBody: string;
  downloadQuoteUrl?: string;
}

// ========================================
// EL CAR WASH CONFIGURATION (DEFAULT EXAMPLE)
// ========================================
const EL_CAR_WASH_CONFIG: CampaignConfig = {
  companyName: "El Car Wash",
  companyTagline: "America's Most Sustainable Car Wash Chain",
  industry: "car_wash",

  heroTitle: "Transform El Car Wash Into",
  heroSubtitle:
    "Portfolio-wide solar + battery transformation: $2.1M investment → $180K/year savings → 5.8yr payback across 5 Florida locations",
  heroHighlight: "ALPHA PARTNERSHIP OPPORTUNITY",

  portfolioMetrics: {
    totalInvestment: "$2.1M",
    investmentNote: "5 Florida Sites",
    annualSavings: "$180K",
    savingsNote: "Year 1",
    payback: "5.8yr",
    paybackNote: "Simple Payback",
    roi: "110%",
    roiNote: "Base Case",
  },

  featuredLocation: {
    name: "Miami Flagship Location",
    annualSavings: "$38.5K",
    demandCharges: "$29.3K",
    energyArbitrage: "$9.2K",
    roi: "116%",
    payback: "5.8 years",
    irr: "19.4%",
    investment: "$448K",
    npv: "$627K",
    netGain: "$179K",
    peakLoad: "220 kW",
    solarSize: "165 kW",
    solarCoverage: "75% coverage",
    batteryEnergy: "413 kWh",
    batteryPower: "132 kW power",
    duration: "3.1 hrs",
    backupTime: "<16ms",
  },

  investmentBreakdown: {
    battery: "$172,000",
    solar: "$140,000",
    balance: "$59,000",
    labor: "$77,000",
  },

  valueProps: [
    {
      icon: "✓",
      title: "Solar Carport = Free Real Estate",
      description: "Customer parking provides shade + 75% solar coverage—no roof modifications",
    },
    {
      icon: "✓",
      title: "Peak Shaving Saves $29K/year",
      description: "BESS reduces demand charges during 11am-7pm wash peak hours",
    },
    {
      icon: "✓",
      title: "Brand Differentiation",
      description: '"Solar-Powered Car Wash" marketing value + sustainability positioning',
    },
    {
      icon: "✓",
      title: "Hurricane-Rated Equipment",
      description: "150+ mph wind-rated + instant backup power (<16ms transfer)",
    },
  ],

  whyThisCompany: {
    title: "Why El Car Wash Is the Perfect Alpha Partner",
    reasons: [
      {
        icon: "💼",
        title: "PE-Backed Speed & Scale",
        description:
          "Financial sophistication, fast decisions, 50+ site portfolio for national rollout",
      },
      {
        icon: "☀️",
        title: "Florida Footprint = Max ROI",
        description:
          "Best solar resource (1,700 kWh/kW/yr), high electricity rates, hurricane resilience value",
      },
      {
        icon: "🚗",
        title: "Perfect Use Case Fit",
        description:
          "Customer parking = free solar real estate, predictable loads, ideal for carport systems",
      },
    ],
  },

  locations: [
    {
      city: "Miami",
      peak: "220 kW",
      investment: "$448K",
      savings: "$38.5K",
      payback: "5.8yr",
      irr: "19.4%",
    },
    {
      city: "Ft. Lauderdale",
      peak: "190 kW",
      investment: "$405K",
      savings: "$33.2K",
      payback: "6.1yr",
      irr: "18.7%",
    },
    {
      city: "Tampa",
      peak: "165 kW",
      investment: "$368K",
      savings: "$29.4K",
      payback: "6.2yr",
      irr: "18.3%",
    },
    {
      city: "Orlando",
      peak: "190 kW",
      investment: "$407K",
      savings: "$33.8K",
      payback: "6.0yr",
      irr: "18.9%",
    },
    {
      city: "Jacksonville",
      peak: "165 kW",
      investment: "$365K",
      savings: "$28.9K",
      payback: "6.3yr",
      irr: "18.1%",
    },
  ],

  scenarios: [
    {
      name: "Solar Only",
      investment: "$185K",
      savings: "$17.4K",
      payback: "10.6yr",
      roi: "48%",
      note: "Lowest cost",
    },
    {
      name: "Solar + BESS",
      investment: "$448K",
      savings: "$38.5K",
      payback: "5.8yr",
      roi: "116%",
      note: "✅ Recommended",
      highlight: true,
    },
    {
      name: "Solar + BESS + Backup",
      investment: "$595K",
      savings: "$40.2K",
      payback: "7.4yr",
      roi: "95%",
      note: "Max resilience",
    },
    {
      name: "Solar + BESS + EV",
      investment: "$496K",
      savings: "$80.5K",
      payback: "6.2yr",
      roi: "162%",
      note: "New revenue",
    },
    {
      name: "Complete Package",
      investment: "$643K",
      savings: "$82.2K",
      payback: "7.8yr",
      roi: "128%",
      note: "Flagship showcase",
    },
  ],

  emailSubject: "El Car Wash Partnership Inquiry",
  emailBody:
    "I'd like to discuss the solar + battery transformation opportunity for El Car Wash. Please contact me at your earliest convenience.",
  downloadQuoteUrl: "/campaigns/EL_CAR_WASH_FLORIDA_QUOTES.md",
};

// ========================================
// GENERIC CAR WASH TEMPLATE CONFIG
// ========================================
// Use this as a starting point for new car wash campaigns
const GENERIC_CAR_WASH_CONFIG: CampaignConfig = {
  companyName: "[Your Car Wash Name]",
  companyTagline: "Sustainable Car Wash Solutions",
  industry: "car_wash",

  heroTitle: "Solar + Battery Solutions for",
  heroSubtitle:
    "Reduce energy costs, enhance sustainability, and provide backup power for your car wash operations",
  heroHighlight: "CAR WASH ENERGY TRANSFORMATION",

  portfolioMetrics: null, // Hide if single location

  featuredLocation: {
    name: "Your Location",
    annualSavings: "$XX.XK",
    demandCharges: "$XX.XK",
    energyArbitrage: "$X.XK",
    roi: "XXX%",
    payback: "X.X years",
    irr: "XX.X%",
    investment: "$XXXK",
    npv: "$XXXK",
    netGain: "$XXXK",
    peakLoad: "XXX kW",
    solarSize: "XXX kW",
    solarCoverage: "XX% coverage",
    batteryEnergy: "XXX kWh",
    batteryPower: "XXX kW power",
    duration: "X.X hrs",
    backupTime: "<XXms",
  },

  investmentBreakdown: {
    battery: "$XXX,000",
    solar: "$XXX,000",
    balance: "$XX,000",
    labor: "$XX,000",
  },

  valueProps: [
    {
      icon: "✓",
      title: "Solar Carport = Free Real Estate",
      description: "Use customer parking for solar panels while providing shade",
    },
    {
      icon: "✓",
      title: "Demand Charge Savings",
      description: "Reduce peak demand charges during operating hours",
    },
    {
      icon: "✓",
      title: "Brand Value",
      description: "Market as an environmentally-conscious business",
    },
    {
      icon: "✓",
      title: "Backup Power",
      description: "Keep operations running during power outages",
    },
  ],

  whyThisCompany: {
    title: "Why This Makes Sense for Your Car Wash",
    reasons: [
      {
        icon: "💰",
        title: "Fast ROI",
        description: "Typical payback period of 5-7 years with significant long-term savings",
      },
      {
        icon: "⚡",
        title: "High Energy Use",
        description: "Car washes have high electricity consumption, making solar highly effective",
      },
      {
        icon: "🅿️",
        title: "Perfect Layout",
        description: "Customer parking lots are ideal for solar carport installations",
      },
    ],
  },

  locations: null,
  scenarios: null,

  emailSubject: "Car Wash Solar + Battery Inquiry",
  emailBody: "I'd like to learn more about solar and battery solutions for my car wash.",
};

// ========================================
// COMPONENT
// ========================================

interface CarWashCampaignProps {
  config?: CampaignConfig;
}

export default function CarWashCampaign({ config = EL_CAR_WASH_CONFIG }: CarWashCampaignProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    // no-op
  }, []);

  // Wizard fullscreen mode
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
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(62,207,142,0.35)";
            e.currentTarget.style.background = "rgba(8,11,20,0.95)";
            e.currentTarget.style.color = "#3ECF8E";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.background = "rgba(8,11,20,0.85)";
            e.currentTarget.style.color = "rgba(255,255,255,0.65)";
          }}
        >
          ← Back to Campaign
        </button>
        <MiniWizardV8 industry={config.industry} companyName={config.companyName} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #0D1B34 0%, #080F20 60%, #0D1B34 100%)" }}
    >
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: "rgba(8,15,32,0.85)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.09)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <ElCarWashLogo height={32} />
              <span className="text-[11px] text-slate-500 font-mono border-l border-white/10 pl-4">
                powered by Merlin Energy
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
                style={{ background: "linear-gradient(135deg, #3ECF8E, #2db87a)", color: "#000" }}
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <span className="text-emerald-400 text-sm font-semibold">
                🎯 {config.heroHighlight}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {config.heroTitle}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                {config.companyTagline}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">{config.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-8 py-4 border-2 border-emerald-500 text-emerald-400 text-lg font-semibold rounded-lg hover:border-emerald-400 hover:text-emerald-300 transition-all"
                style={{ background: "transparent" }}
              >
                📅 Schedule Demo
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="px-12 py-5 border-[3px] border-cyan-400 text-cyan-300 text-2xl font-black rounded-xl hover:border-cyan-300 hover:text-cyan-200 hover:shadow-2xl hover:shadow-cyan-400/30 transition-all transform hover:scale-105"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 30px rgba(34, 211, 238, 0.15)",
                }}
              >
                📊 Get Your Live Quote
              </button>
            </div>
          </div>

          {/* Portfolio Metrics - Optional */}
          {config.portfolioMetrics && (
            <div className="grid md:grid-cols-4 gap-6 mb-20">
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-2">
                  {config.portfolioMetrics.totalInvestment}
                </div>
                <div className="text-gray-300">Total Investment</div>
                <div className="text-sm text-gray-500 mt-1">
                  {config.portfolioMetrics.investmentNote}
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {config.portfolioMetrics.annualSavings}
                </div>
                <div className="text-gray-300">Annual Savings</div>
                <div className="text-sm text-gray-500 mt-1">
                  {config.portfolioMetrics.savingsNote}
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {config.portfolioMetrics.payback}
                </div>
                <div className="text-gray-300">Avg Payback</div>
                <div className="text-sm text-gray-500 mt-1">
                  {config.portfolioMetrics.paybackNote}
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  {config.portfolioMetrics.roi}
                </div>
                <div className="text-gray-300">10-Year ROI</div>
                <div className="text-sm text-gray-500 mt-1">{config.portfolioMetrics.roiNote}</div>
              </div>
            </div>
          )}

          {/* Featured Location Example */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 px-5 py-2 border-2 border-emerald-400 rounded-full mb-6">
                <span className="text-emerald-400 text-sm font-bold tracking-wide">
                  LIVE QUOTE EXAMPLE
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                {config.featuredLocation.name}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Real numbers. Real savings. No smoke and mirrors.
              </p>
            </div>

            {/* HERO NUMBERS */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Annual Savings */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-[#080F20]/90 backdrop-blur-xl border-[3px] border-cyan-400 rounded-2xl p-8 text-center hover:border-cyan-300 transition-all">
                  <div className="text-sm font-bold text-cyan-400 tracking-wider mb-2">
                    ANNUAL SAVINGS
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    {config.featuredLocation.annualSavings}
                  </div>
                  <div className="text-lg text-cyan-300 font-semibold mb-3">/year guaranteed</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-3"></div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Demand charges:{" "}
                      <span className="text-cyan-300">{config.featuredLocation.demandCharges}</span>
                    </div>
                    <div>
                      Energy arbitrage:{" "}
                      <span className="text-cyan-300">
                        {config.featuredLocation.energyArbitrage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-[#080F20]/90 backdrop-blur-xl border-[3px] border-orange-400 rounded-2xl p-8 text-center hover:border-orange-300 transition-all">
                  <div className="text-sm font-bold text-orange-400 tracking-wider mb-2">
                    10-YEAR ROI
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    {config.featuredLocation.roi}
                  </div>
                  <div className="text-lg text-orange-300 font-semibold mb-3">above break-even</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mb-3"></div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-[#080F20]/90 backdrop-blur-xl border-[3px] border-emerald-400 rounded-2xl p-8 text-center hover:border-emerald-300 transition-all">
                  <div className="text-sm font-bold text-emerald-400 tracking-wider mb-2">
                    TOTAL INVESTMENT
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    {config.featuredLocation.investment}
                  </div>
                  <div className="text-lg text-emerald-300 font-semibold mb-3">
                    turnkey installed
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-3"></div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      25-yr NPV:{" "}
                      <span className="text-emerald-300">{config.featuredLocation.npv}</span>
                    </div>
                    <div>
                      Net gain:{" "}
                      <span className="text-emerald-300">{config.featuredLocation.netGain}</span>
                    </div>
                  </div>
                  <div
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(62,207,142,0.15)",
                      border: "1px solid rgba(62,207,142,0.3)",
                      color: "#3ECF8E",
                    }}
                  >
                    30% ITC reduces net cost by ~$134K
                  </div>
                </div>
              </div>
            </div>

            {/* System Configuration & Value Props Combined */}
            <div
              className="border border-white/[0.12] rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-emerald-400 mr-3">⚡</span>
                  System Configuration
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-emerald-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Peak Load</div>
                    <div className="text-2xl font-bold text-white">
                      {config.featuredLocation.peakLoad}
                    </div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-cyan-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Solar Carport</div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {config.featuredLocation.solarSize}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {config.featuredLocation.solarCoverage}
                    </div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-orange-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Battery Storage</div>
                    <div className="text-2xl font-bold text-orange-300">
                      {config.featuredLocation.batteryEnergy}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {config.featuredLocation.batteryPower}
                    </div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-emerald-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <div className="text-2xl font-bold text-emerald-300">
                      {config.featuredLocation.duration}
                    </div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-cyan-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Backup</div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {config.featuredLocation.backupTime}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">transfer time</div>
                  </div>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="p-8 border-t border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-emerald-400 mr-3">💰</span>
                  Investment Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-gray-300 font-medium">Battery Storage System</span>
                    <span className="text-emerald-400 font-bold text-xl">
                      {config.investmentBreakdown.battery}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-cyan-400 transition-all">
                    <span className="text-gray-300 font-medium">Solar Carport Installation</span>
                    <span className="text-cyan-400 font-bold text-xl">
                      {config.investmentBreakdown.solar}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-orange-400 transition-all">
                    <span className="text-gray-300 font-medium">Balance of System</span>
                    <span className="text-orange-400 font-bold text-xl">
                      {config.investmentBreakdown.balance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-gray-300 font-medium">EPC & Installation Labor</span>
                    <span className="text-emerald-400 font-bold text-xl">
                      {config.investmentBreakdown.labor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Value Props */}
              <div className="p-8 border-t border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-cyan-400 mr-3">🌟</span>
                  Why This Works
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {config.valueProps.map((prop, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 p-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all"
                    >
                      <span className="text-emerald-400 text-2xl">{prop.icon}</span>
                      <div>
                        <div className="text-white font-bold mb-1">{prop.title}</div>
                        <div className="text-gray-400 text-sm">{prop.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Footer */}
              <div className="bg-gray-900/80 border-t-2 border-gray-700 px-8 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-gray-400">
                    <span className="text-emerald-400 font-semibold">TrueQuote™</span> verified
                    pricing • 25-year warranty • Valid 90 days
                  </div>
                  <div className="flex gap-3">
                    {config.downloadQuoteUrl && (
                      <button
                        onClick={() => window.open(config.downloadQuoteUrl, "_blank")}
                        className="px-6 py-3 border-2 border-cyan-400 text-cyan-400 font-bold rounded-lg hover:bg-cyan-400/10 transition-all"
                      >
                        Download Full Quote
                      </button>
                    )}
                    <button
                      onClick={() =>
                        window.open(
                          `mailto:sales@merlinbess.com?subject=${encodeURIComponent(config.emailSubject)}&body=${encodeURIComponent(config.emailBody)}`,
                          "_blank"
                        )
                      }
                      className="px-6 py-3 border-2 border-emerald-400 text-emerald-400 font-bold rounded-lg hover:bg-emerald-400/10 transition-all"
                    >
                      Request Custom Quote →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why This Company Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-12 mb-20">
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

          {/* Multiple Locations - Optional */}
          {config.locations && (
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                📍 {config.locations.length} Locations Ready for Transformation
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {config.locations.map((site) => (
                  <div
                    key={site.city}
                    className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-5"
                  >
                    <div className="text-lg font-bold text-white mb-3">{site.city}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peak Load</span>
                        <span className="text-gray-200 font-semibold">{site.peak}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Investment</span>
                        <span className="text-emerald-400 font-semibold">{site.investment}</span>
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

          {/* Scenarios - Optional */}
          {config.scenarios && (
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                🚀 Scenario Analysis: {config.featuredLocation.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {config.scenarios.map((scenario) => (
                  <div
                    key={scenario.name}
                    className={`backdrop-blur border rounded-xl p-5 ${
                      scenario.highlight
                        ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30"
                        : "bg-gray-800/50 border-gray-700"
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-400 mb-1">{scenario.note}</div>
                    <div className="text-lg font-bold text-white mb-3">{scenario.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Investment</span>
                        <span className="text-emerald-400 font-semibold">
                          {scenario.investment}
                        </span>
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

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 backdrop-blur border border-emerald-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform {config.companyName}?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get a custom quote, schedule a demo, or download detailed financial projections.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
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
                className="px-8 py-4 bg-gray-700 text-white text-lg font-semibold rounded-lg hover:bg-gray-600 transition"
              >
                🧮 Try Quote Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-12 px-4" style={{ borderColor: "rgba(255,255,255,0.09)" }}>
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p className="mb-4">⚡ Merlin Energy — Car Wash Energy Transformation</p>
          <p className="text-sm">
            Campaign: {config.companyName} |{" "}
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            <br />
            For inquiries:{" "}
            <a
              href="mailto:sales@merlinenergy.net"
              className="text-emerald-400 hover:text-emerald-300"
            >
              sales@merlinenergy.net
            </a>
          </p>
        </div>
      </div>

      {/* Schedule Demo Modal */}
      <ScheduleDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  );
}

// Export both configs for easy reuse
export { EL_CAR_WASH_CONFIG, GENERIC_CAR_WASH_CONFIG };
export type { CampaignConfig };
