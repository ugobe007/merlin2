/* Merlin Energy — Navbar */

import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, User, LayoutDashboard, Lock } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { authService } from "@/services/authService";
import { isCurrentUserAdmin } from "@/services/adminAuthService";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const isAdmin = isCurrentUserAdmin();

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

  const handleAdminClick = (e: React.MouseEvent) => {
    if (!isAdmin) {
      e.preventDefault();
      alert(
        "Administrator credentials required. Please log in with your administrator account to access the Admin Panel."
      );
      openSignIn();
    } else {
      setMobileOpen(false);
    }
  };

  const handleProtectedToolClick = (e: React.MouseEvent, targetHref: string) => {
    if (!isAdmin) {
      e.preventDefault();
      alert(
        "Administrator access required. You must be logged in as an administrator to access Platform & Tools."
      );
      openSignIn();
    } else {
      setMobileOpen(false);
      window.location.href = targetHref;
    }
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
              {isAdmin ? (
                <div className="flex items-center gap-2.5">
                  <a
                    href="/admin"
                    onClick={handleAdminClick}
                    className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all duration-200"
                  >
                    <LayoutDashboard size={14} />
                    Admin Panel Active
                  </a>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 px-1 font-medium">
                    <User size={14} className="text-amber-400" />
                    <span style={{ fontFamily: "'Manrope', sans-serif" }}>
                      {currentUser?.firstName || currentUser?.email || "Admin"}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await authService.signOut();
                      setCurrentUser(null);
                      window.location.reload();
                    }}
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-slate-700/60 bg-slate-800/40 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-200"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <a
                    href="/admin"
                    onClick={handleAdminClick}
                    className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold text-amber-400/90 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 transition-all duration-200"
                    title="Requires Admin Authentication"
                  >
                    <Lock size={12} />
                    Admin Panel
                  </a>
                  <button
                    onClick={openSignIn}
                    className="h-9 inline-flex items-center justify-center px-3.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-all duration-200"
                  >
                    Log In
                  </button>
                  <a
                    href="/wizard"
                    className="h-9 inline-flex items-center justify-center px-4 rounded-lg border border-blue-400/60 bg-blue-600/25 text-xs font-semibold text-blue-200 hover:bg-blue-600/40 hover:border-blue-300 shadow-sm shadow-blue-500/10 transition-all duration-200"
                  >
                    Activate Agent
                  </a>
                </>
              )}

              {/* Desktop Hamburger button toggle */}
              <button
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200 ml-1"
                onClick={() => setMobileOpen(!mobileOpen)}
                title="Navigation Menu"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
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
          <div className="bg-[#060D1F]/95 backdrop-blur-xl border-b border-slate-700/80 px-4 py-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Column 1: Public Navigation */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
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

              {/* Column 2: Access & Admin */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Lock size={12} /> Access & Admin Panel
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={openSignIn}
                    className="text-left py-2 px-3 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    🔑{" "}
                    {currentUser
                      ? `Signed In (${currentUser.firstName || currentUser.email})`
                      : "Log In / Sign In"}
                  </button>
                  <a
                    href="/admin"
                    onClick={handleAdminClick}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                      isAdmin
                        ? "text-amber-300 bg-amber-900/30 hover:bg-amber-900/50"
                        : "text-slate-400 bg-slate-800/40 hover:bg-amber-900/20 hover:text-amber-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">⚙️ Admin Panel</span>
                    {!isAdmin && <Lock size={13} className="text-amber-400/80" />}
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

              {/* Column 3: Platform & Tools */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 mb-2">
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
                    href="/quote-builder"
                    className="py-2 px-3 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    ⚡ ProStack Builder
                  </a>
                  <a
                    href="/workflow"
                    className="py-2 px-3 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    📊 Merlin Energy OS
                  </a>
                  <a
                    href="/campaign"
                    onClick={(e) => handleProtectedToolClick(e, "/campaign")}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                      isAdmin
                        ? "text-amber-300 hover:text-amber-200 hover:bg-slate-800/60"
                        : "text-slate-400 hover:text-amber-300 hover:bg-slate-800/40"
                    }`}
                  >
                    <span>🎯 Outbound Sales Panel</span>
                    {!isAdmin && <Lock size={12} className="text-amber-400/80" />}
                  </a>
                </div>
              </div>

              {/* Column 4: Quick Launch */}
              <div className="flex flex-col justify-between pt-2 sm:pt-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Session Rights
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-3 space-y-1">
                  <div className="font-semibold text-slate-300">
                    Status: {isAdmin ? "⚡ Administrator Active" : "👤 Standard Guest"}
                  </div>
                  <p className="text-[11px]">
                    {isAdmin
                      ? "Full administrative rights unlocked across all tools."
                      : "Admin Panel & Sales Outreach require administrator login."}
                  </p>
                </div>
                <a
                  href="/wizard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl p-3 text-center text-sm font-bold border border-blue-400/70 bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 transition-colors shadow-lg flex items-center justify-center gap-2"
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
        onLoginSuccess={() => {
          setShowAuth(false);
          window.location.reload();
        }}
        defaultMode={authMode}
      />
    </>
  );
}
