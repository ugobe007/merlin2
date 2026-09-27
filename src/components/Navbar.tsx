/* Merlin Energy — Navbar */

import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, LayoutDashboard } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { authService } from "@/services/authService";

const ADMIN_EMAILS = ["ugobe07@gmail.com", "admin@merlinenergy.net", "viewer@merlinenergy.net"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const isAdmin = !!currentUser && ADMIN_EMAILS.includes(currentUser.email);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Re-render when auth state changes (OAuth redirect, sign in, sign out)
  useEffect(() => {
    const onAuthChange = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener("merlin:authchange", onAuthChange);
    return () => window.removeEventListener("merlin:authchange", onAuthChange);
  }, []);

  const openSignIn = () => {
    setAuthMode("login");
    setShowAuth(true);
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Grid Exposure", href: "/#grid-exposure" },
    { label: "Energy OS", href: "/workflow" },
    { label: "Pricing", href: "/pricing" },
    { label: "Support", href: "/support" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050608]/92 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-[#050608]/82 backdrop-blur-sm border-b border-white/[0.04]"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <img
                src="/merlin-icon.png"
                alt="MERLIN"
                className="h-8 w-8 rounded-md object-contain transition-opacity duration-200 group-hover:opacity-90"
              />
              <span
                className="text-lg font-black tracking-[-0.02em] text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                MERLIN
              </span>
              <span className="rounded-full border border-blue-500/35 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] text-blue-500 whitespace-nowrap inline-flex items-center shrink-0">
                AGENT V2.4
              </span>
            </a>

            {/* Center nav — desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.05] transition-all duration-200 font-medium"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right nav — desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {/* Admin link */}
                  <a
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-md hover:bg-amber-500/[0.08]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <LayoutDashboard size={14} />
                    Admin Panel
                  </a>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <User size={15} className="text-slate-400" />
                    <span style={{ fontFamily: "'Manrope', sans-serif" }}>
                      {currentUser.firstName || currentUser.email}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await authService.signOut();
                      setCurrentUser(null);
                    }}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <a
                    href="/admin"
                    className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-center gap-1"
                  >
                    <LayoutDashboard size={13} />
                    Admin
                  </a>
                  <a
                    href="/support"
                    className="text-xs text-slate-300 hover:text-white transition-colors font-medium px-2.5 py-1.5"
                  >
                    Support
                  </a>
                  <button
                    onClick={openSignIn}
                    className="text-sm text-slate-200 hover:text-white transition-colors font-semibold px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Log In
                  </button>
                  <a
                    href="/wizard"
                    className="rounded-lg border border-blue-400/70 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-300 transition-all duration-200 hover:border-blue-300 hover:text-blue-200"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Activate Agent
                  </a>
                </>
              )}

              {/* Desktop Hamburger button toggle */}
              <button
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border border-slate-700/60 ml-1"
                onClick={() => setMobileOpen(!mobileOpen)}
                title="Navigation Menu"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Hamburger dropdown menu (Mobile & Desktop) */}
        {mobileOpen && (
          <div className="bg-[#060D1F]/95 backdrop-blur-xl border-b border-slate-700/80 px-4 py-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Navigation
                </div>
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="py-2 px-3 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Access & Support
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={openSignIn}
                    className="text-left py-2 px-3 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    🔑 Log In / Sign In
                  </button>
                  <a
                    href="/admin"
                    className="py-2 px-3 text-amber-300 hover:text-amber-200 hover:bg-amber-900/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    ⚙️ Admin Panel
                  </a>
                  <a
                    href="/support"
                    className="py-2 px-3 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    💬 Support & FAQ
                  </a>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2">
                  Platforms & Tools
                </div>
                <div className="flex flex-col gap-1">
                  <a
                    href="/wizard"
                    className="py-2 px-3 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    ⚡ StackQuote Wizard
                  </a>
                  <a
                    href="/campaign"
                    className="py-2 px-3 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    🎯 Outbound Sales Panel
                  </a>
                  <a
                    href="/workflow"
                    className="py-2 px-3 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    📊 Merlin Energy OS
                  </a>
                </div>
              </div>

              <div className="flex flex-col justify-between pt-2 sm:pt-0">
                <a
                  href="/wizard"
                  className="rounded-xl border border-blue-400/70 bg-blue-600/30 p-3 text-center text-sm font-bold text-blue-200 hover:bg-blue-600/50 transition-colors shadow-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  🚀 Launch Merlin Agent
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal — Sign In / Sign Up */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={() => setShowAuth(false)}
        defaultMode={authMode}
      />
    </>
  );
}
