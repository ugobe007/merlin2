/* Merlin Energy — Products Section
   Design: Asymmetric 60/40 layout — TrueQuote dominates, ProQuote is secondary
   Hierarchy reflects the primary user path */

import { CheckCircle2, ArrowRight } from "lucide-react";

const TRUEQUOTE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-truequote-card-cpJmBRRXhYFbZrmHadSGfP.png";
const PROQUOTE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-proquote-card-Pkbm64BS4o6epafAMmSoof.png";
const SHIELD_GOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

const trueQuoteOutcomes = [
  "Discover savings potential",
  "Understand full project costs",
  "Build your energy strategy",
  "Create RFP-ready outputs",
  "Save and share quote profiles",
];

const proQuoteOutcomes = [
  "Vendor-ready quotes in minutes",
  "Bid on incoming RFPs",
  "Standardized proposal templates",
  "Manage your project pipeline",
];

export default function ProductsSection() {
  return (
    <section id="products" className="pt-8 pb-20 bg-[#060D1F]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Section label — left-edge vertical style */}
        <div className="flex items-start gap-8 mb-16">
          <div className="hidden lg:flex flex-col items-center gap-3 pt-1">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-blue-500/50" />
            <span
              className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Products
            </span>
          </div>
          <div>
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3 lg:hidden">
              Products
            </p>
            <h2
              className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Two ways in.
              <br />
              <span className="gradient-text">One platform.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Whether you're evaluating a project or building a proposal, Merlin has a product built for your role.
            </p>
          </div>
        </div>

        {/* Asymmetric product cards */}
        <div className="grid lg:grid-cols-[3fr_2fr] gap-5">

          {/* TrueQuote — dominant */}
          <div className="card-glass rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            {/* Image — taller for dominant card */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={TRUEQUOTE_IMG}
                alt="TrueQuote dashboard"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B38] via-[#0D1B38]/20 to-transparent" />
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300 uppercase tracking-wide">
                  For Customers
                </span>
                <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-500/15 border border-yellow-400/30 text-yellow-400 uppercase tracking-wide">
                  Primary
                </span>
              </div>
            </div>

            <div className="p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-4">
                <img src={SHIELD_GOLD} alt="TrueQuote" className="w-10 h-10 object-contain flex-shrink-0" />
                <div>
                  <h3
                    className="text-3xl font-bold text-yellow-400 mb-0.5"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    TrueQuote
                  </h3>
                  <p className="text-slate-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Business owners · Developers · Investors · Operators
                  </p>
                </div>
              </div>

              <p className="text-slate-300 text-base mb-7 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Understand your energy project before you commit. TrueQuote models savings, costs, ROI, and what to build — so you can make a confident decision.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                {trueQuoteOutcomes.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="/wizard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-yellow-400 border border-yellow-500/40 hover:border-yellow-400 hover:text-yellow-300 transition-all duration-200"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a TrueQuote
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* ProQuote — secondary */}
          <div
            className="rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col"
            style={{
              background: "rgba(13, 27, 56, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.15)",
            }}
          >
            <div className="relative h-48 overflow-hidden flex-shrink-0">
              <img
                src={PROQUOTE_IMG}
                alt="ProQuote proposal builder"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B38] via-[#0D1B38]/20 to-transparent" />
              <div className="absolute top-5 left-5">
                <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 uppercase tracking-wide">
                  For Vendors
                </span>
              </div>
            </div>

            <div className="p-7 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-1">
                <img src={SHIELD_BLUE} alt="ProQuote" className="w-9 h-9 object-contain flex-shrink-0" />
                <h3
                  className="text-2xl font-bold text-blue-400"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  ProQuote
                </h3>
              </div>
              <p className="text-slate-500 text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                EPC firms · Solar developers · Engineers
              </p>

              <p className="text-slate-300 text-sm mb-6 leading-relaxed flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Build vendor-ready quotes faster. ProQuote standardizes your proposals and moves you from inquiry to proposal without the friction.
              </p>

              <ul className="space-y-2 mb-7">
                {proQuoteOutcomes.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={14} className="text-cyan-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="/proquote"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-200"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a ProQuote
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
