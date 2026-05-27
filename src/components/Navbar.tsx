/* Merlin Energy — Navbar */

import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, LayoutDashboard, FileText } from "lucide-react";
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
    { label: "Grid Exposure", href: "/#grid-exposure" },
    { label: "How MERLIN Works", href: "/#workflow" },
    { label: "Energy Stacking", href: "/#energy-stacking" },
    { label: "Why Independent", href: "/#platform" },
    { label: "Our Story", href: "/#our-story" },
    { label: "Pricing", href: "/pricing" },
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
              <span className="rounded-full border border-blue-500/35 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] text-blue-500">
                AGENT V2.4
              </span>
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
            <div className="hidden lg:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {/* Admin links */}
                  {isAdmin && (
                    <>
                      <a
                        href="/admin"
                        className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-md hover:bg-amber-500/[0.08]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        <LayoutDashboard size={14} />
                        Admin
                      </a>
                      <a
                        href="/admin?tab=whitepapers"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/[0.05]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        <FileText size={14} />
                        Whitepapers
                      </a>
                    </>
                  )}
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
                  {/* Sign In */}
                  <button
                    onClick={openSignIn}
                    className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Sign In
                  </button>
                  <a
                    href="/wizard"
                    className="rounded-lg border border-blue-400/70 bg-transparent px-4 py-2 text-sm font-semibold text-blue-300 transition-all duration-200 hover:border-blue-300 hover:text-blue-200"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Activate Agent
                  </a>
                </>
              )}
            </div>

            {/* Mobile toggle */}
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
              <button
                onClick={openSignIn}
                className="text-left text-sm text-slate-400 font-medium"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Sign In
              </button>
              <a
                href="/wizard"
                className="rounded-lg border border-blue-400/70 bg-transparent px-4 py-2.5 text-center text-sm font-semibold text-blue-300"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Activate Agent
              </a>
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
