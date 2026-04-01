/* Merlin Energy — Homepage
   Design: Cosmic Blueprint — dark navy, Space Grotesk, blue-cyan accents
   Sections: Navbar → Hero → Stats → Products → Platform → Industries → Workflow → Value → Footer */

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DailyDealCard from "@/components/DailyDealCard";
import ProductsSection from "@/components/ProductsSection";
import PlatformSection from "@/components/PlatformSection";
import IndustriesSection from "@/components/IndustriesSection";
import WorkflowSection from "@/components/WorkflowSection";
import ValueSection from "@/components/ValueSection";

const WIZARD_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-wizard_11d2b1f0.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060D1F]">
      <Navbar />
      <HeroSection />
      <DailyDealCard />
      <ProductsSection />
      <PlatformSection />
      <IndustriesSection />
      <WorkflowSection />
      <ValueSection />

      {/* Footer */}
      <footer className="bg-[#060D1F] border-t border-white/[0.05] pt-14 pb-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Top row — brand + columns */}
          <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={WIZARD_URL}
                  alt="Merlin"
                  className="w-8 h-8 rounded-full object-contain"
                />
                <div>
                  <div
                    className="text-white font-bold text-base"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Merlin Energy
                  </div>
                  <div
                    className="text-slate-600 text-xs"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Energy decision platform
                  </div>
                </div>
              </div>
              <p
                className="text-slate-600 text-sm leading-relaxed max-w-xs"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Real costs. Real savings. Built on NREL data, DOE frameworks, and Sandia-aligned
                logic.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4
                className="text-white text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Products
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "TrueQuote", href: "/wizard" },
                  { label: "ProQuote", href: "/proquote" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Partner API", href: "/widget" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4
                className="text-white text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Industries
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Manufacturing", href: "/manufacturing" },
                  { label: "Hotels", href: "/hotel" },
                  { label: "Data Centers", href: "/data-center" },
                  { label: "Car Washes", href: "/car-wash" },
                  { label: "Multifamily", href: "#industries" },
                  { label: "EV Charging", href: "/ev-charging" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4
                className="text-white text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Platform
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "How It Works", href: "#workflow" },
                  { label: "Platform", href: "#platform" },
                  { label: "Market Intel", href: "/market-intelligence" },
                  { label: "News", href: "/news" },
                  { label: "Support", href: "/support" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4
                className="text-white text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Account
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Sign In", href: "/account" },
                  { label: "Sign Up", href: "/wizard" },
                  { label: "My Account", href: "/account" },
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-slate-700 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              © {new Date().getFullYear()} Merlin Energy. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/wizard"
                className="text-xs text-yellow-600/70 hover:text-yellow-400 font-semibold transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a TrueQuote →
              </a>
              <a
                href="/proquote"
                className="text-xs text-blue-600/70 hover:text-blue-400 font-semibold transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a ProQuote →
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
