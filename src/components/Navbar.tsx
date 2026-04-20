/* Merlin Energy — Navbar
   Wired: TrueQuote → /wizard, ProQuote → /proquote
          Sign In / Sign Up → AuthModal (defaultMode)
          About Merlin → AboutMerlinModal */

import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, LayoutDashboard, FileText } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { AboutMerlinModal } from "@/components/modals/AboutMerlinModal";
import { authService } from "@/services/authService";

const ADMIN_EMAILS = ["ugobe07@gmail.com", "admin@merlinenergy.net", "viewer@merlinenergy.net"];

const WIZARD_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-wizard_11d2b1f0.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showAbout, setShowAbout] = useState(false);
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
  const openSignUp = () => {
    setAuthMode("signup");
    setShowAuth(true);
    setMobileOpen(false);
  };
  const openAbout = () => {
    setShowAbout(true);
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Products", href: "#products" },
    { label: "Industries", href: "#industries" },
    { label: "Platform", href: "#platform" },
    { label: "How It Works", href: "#workflow" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#060D1F]/92 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
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
                  TrueQuote
                </span>
                <span
                  className="text-[9px] font-medium tracking-[0.2em] uppercase"
                  style={{ fontFamily: "'Manrope', sans-serif", color: "#F2C14F" }}
                >
                  ™
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
              <button
                onClick={openAbout}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-md hover:bg-white/[0.05] transition-all duration-200 font-medium"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                About
              </button>
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
                  {/* Sign Up */}
                  <button
                    onClick={openSignUp}
                    className="text-sm font-semibold text-slate-300 hover:text-white border border-white/25 hover:border-white/50 px-4 py-2 rounded-lg transition-all duration-200"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Sign Up
                  </button>
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
            <button
              onClick={openAbout}
              className="block w-full text-left py-3 text-slate-300 hover:text-white text-sm font-medium border-b border-white/[0.04]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              About
            </button>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={openSignIn}
                className="text-left text-sm text-slate-400 font-medium"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 border border-white/25 text-center"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Sign Up
              </button>
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

      {/* About Merlin Modal */}
      <AboutMerlinModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onStartQuote={() => {
          setShowAbout(false);
          window.location.href = "/wizard";
        }}
      />
    </>
  );
}
