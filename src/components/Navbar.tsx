/* Merlin Energy — Navbar
   Design: Dark glass nav, Outfit logo wordmark, blue CTA button
   Sticky with blur backdrop on scroll */

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const WIZARD_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-wizard_11d2b1f0.png";
const SHIELD_GOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Products", href: "#products" },
    { label: "Industries", href: "#industries" },
    { label: "Platform", href: "#platform" },
    { label: "How It Works", href: "#workflow" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060D1F]/92 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img
              src={WIZARD_URL}
              alt="Merlin wizard icon"
              className="w-8 h-8 object-contain rounded-full"
            />
            <div className="flex flex-col leading-none">
              <span
                className="text-white font-bold text-lg tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Merlin
              </span>
              <span
                className="text-[9px] text-slate-500 font-medium tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Energy
              </span>
            </div>
          </a>

          {/* Center nav — desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-md hover:bg-white/[0.05] transition-all duration-200 font-medium"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right nav — desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#products"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Explore Merlin
            </a>
            <a
              href="/wizard"
              className="btn-glow flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-600/30 hover:border-yellow-500/50 transition-all duration-200"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <img src={SHIELD_GOLD} alt="" className="w-4 h-4 object-contain" />
              Start a TrueQuote
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#060D1F]/95 backdrop-blur-md border-b border-white/[0.06] px-4 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-slate-300 hover:text-white text-sm font-medium border-b border-white/[0.04] last:border-0"
              style={{ fontFamily: "'Manrope', sans-serif" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <a href="#products" className="text-sm text-slate-400 font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Explore Merlin
            </a>
            <a
              href="/wizard"
              className="btn-glow px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 text-center"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Start a TrueQuote →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
