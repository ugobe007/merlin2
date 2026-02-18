import { useState, useEffect } from "react";
import BessQuoteBuilder from "./components/BessQuoteBuilder";
import AdminDashboard from "./components/AdminDashboard";
import VendorPortal from "./components/VendorPortal";
import CarWashEnergy from "./components/verticals/CarWashEnergy";
import EVChargingEnergy from "./components/verticals/EVChargingEnergy";
import HotelEnergy from "./components/verticals/HotelEnergy";
// DEPRECATED: import { WizardV5 } from './components/wizard/_deprecated/v5';
import WizardV6 from "./components/wizard/v6/WizardV6";
// DEPRECATED: Old WizardV7 moved to _deprecated/ (Jan 26, 2026)
import WizardV7Page from "./pages/WizardV7Page"; // V7: Clean SSOT page
import WizardVNextPage from "./pages/WizardVNextPage"; // vNext: luminous HUD scaffold
import MetaCalculationsPage from "./pages/MetaCalculationsPage";
import MarketIntelligencePage from "./pages/MarketIntelligencePage";
import QuoteTemplatePage from "./pages/QuoteTemplatePage";
import AccountPage from "./pages/AccountPage";
import SupportFAQ from "./components/SupportFAQ";
import PricingPage from "./components/pricing/PricingPage";
import CheckoutCallback from "./components/pricing/CheckoutCallback";
// import AdvancedQuoteBuilder from './components/AdvancedQuoteBuilder'; // Unused
import { QuoteProvider } from "./contexts/QuoteContext";

// Test calculations temporarily disabled for production build
// import { testCalculations } from './utils/testCalculations';
// if (typeof window !== 'undefined') {
//   (window as any).testCalculations = testCalculations;
// }

function App() {
  // Check for admin access via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.get("admin");
  const verticalParam = urlParams.get("vertical");
  const advancedParam = urlParams.get("advanced");

  // Check for path-based routing (e.g., /carwashenergy)
  const pathname = window.location.pathname;

  // Route detection for admin and vendor portal
  const isAdminRoute = pathname === "/admin" || adminParam === "true";
  const isVendorPortalRoute = pathname === "/vendor-portal" || pathname === "/vendor";

  const [showAdmin, setShowAdmin] = useState(isAdminRoute);
  const [showVendorPortal] = useState(isVendorPortalRoute);
  // const [showWizard, setShowWizard] = useState(pathname === '/wizard'); // Unused

  // NEW: Direct /quote-builder route support
  // This enables verticals to redirect to Advanced Quote Builder directly
  // const [showAdvancedQuoteBuilder, setShowAdvancedQuoteBuilder] = useState( // Unused
  //   pathname === '/quote-builder' || advancedParam === 'true'
  // );

  // If advanced=true is set, don't activate vertical (let BessQuoteBuilder handle it)
  const [activeVertical] = useState<string | null>(
    advancedParam === "true"
      ? null
      : verticalParam ||
          (pathname === "/carwashenergy" || pathname === "/car-wash"
            ? "carwash"
            : pathname === "/evchargingenergy" || pathname === "/ev-charging"
              ? "evcharging"
              : pathname === "/hotelenergy" || pathname === "/hotel"
                ? "hotel"
                : null)
  );

  // Keyboard shortcut: Ctrl+Shift+A for admin access
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault();
        handleAdminAccess();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Admin authentication with email and password
  const handleAdminAccess = async () => {
    const email = prompt("Enter admin email:");
    if (!email) return;

    const password = prompt("Enter admin password:");
    if (!password) return;

    // Check admin credentials using AdminAuthService (supports multiple admin accounts)
    // Current accounts:
    // - admin@merlinenergy.net / merlin2025 (super admin - full access)
    // - viewer@merlinenergy.net / viewer2025 (limited admin - view only, no edits)
    const { adminAuthService } = await import("./services/adminAuthService");
    const authenticated = adminAuthService.authenticate(email, password);
    if (authenticated) {
      setShowAdmin(true);
    } else {
      alert("Incorrect email or password");
    }
  };

  if (showAdmin) {
    return (
      <div>
        <AdminDashboard />
      </div>
    );
  }

  // Access via /vendor-portal or /vendor - Vendor Portal
  if (showVendorPortal) {
    return <VendorPortal />;
  }

  // White-label verticals
  // Access via ?vertical=carwash or eventually carwashenergy.com
  if (activeVertical === "carwash") {
    return <CarWashEnergy />;
  }

  // Access via ?vertical=evcharging or /evchargingenergy
  if (activeVertical === "evcharging") {
    return <EVChargingEnergy />;
  }

  // Access via ?vertical=hotel or /hotelenergy
  if (activeVertical === "hotel") {
    return <HotelEnergy />;
  }

  // Access via /meta or /meta-calculations - TrueQuote Meta Calculations Dashboard
  if (pathname === "/meta" || pathname === "/meta-calculations" || pathname === "/ssot") {
    return <MetaCalculationsPage />;
  }

  // Access via /support - Support & FAQ page
  if (pathname === "/support" || pathname === "/faq" || pathname === "/help") {
    return <SupportFAQ standalone />;
  }

  // Access via /checkout or any route with ?checkout= — Stripe return handling
  if (pathname === "/checkout" || urlParams.get('checkout')) {
    return <CheckoutCallback />;
  }

  // Access via /pricing - Pricing & Vendor API page
  if (pathname === "/pricing") {
    return <PricingPage />;
  }

  // Access via /account - User subscription & billing management
  if (pathname === "/account" || pathname === "/billing" || pathname === "/subscription") {
    return <AccountPage />;
  }

  // Access via /market-intelligence - Subscriber market reports
  if (pathname === "/market-intelligence" || pathname === "/market" || pathname === "/intelligence") {
    return <MarketIntelligencePage />;
  }

  // Access via /templates or /brand-kit - Quote Template Builder
  if (pathname === "/templates" || pathname === "/brand-kit" || pathname === "/template-builder") {
    return <QuoteTemplatePage />;
  }

  // Access via /wizard or /wizard-v7 - V7 SSOT Wizard (Feb 1, 2026 - NOW THE DEFAULT)
  if (pathname === "/wizard" || pathname === "/wizard-v7" || pathname === "/v7" || pathname === "/wizard/v7") {
    return <WizardV7Page />;
  }

  // Access via /wizard-v6 ONLY - V6 Legacy (kept for testing)
  if (pathname === "/wizard-v6") {
    return <WizardV6 />;
  }

  // Access via /wizard-vnext or /vnext - vNext luminous HUD scaffold (Jan 30, 2026)
  if (pathname === "/wizard-vnext" || pathname === "/vnext") {
    return <WizardVNextPage />;
  }

  // Access via /quote-builder or advanced=true - Show Advanced Quote Builder
  // The BessQuoteBuilder component handles this via the advanced param

  return (
    <QuoteProvider>
      <div>
        <BessQuoteBuilder />

        {/* Floating Admin Access Button - Bottom Right */}
        <button
          onClick={handleAdminAccess}
          className="fixed bottom-4 right-4 bg-gradient-to-br from-purple-700 to-slate-600 hover:from-purple-800 hover:to-slate-700 text-white p-4 rounded-full shadow-xl shadow-purple-700/30 transition-all z-40 opacity-90 hover:opacity-100 hover:scale-110 border-2 border-purple-500 animate-pulse hover:animate-none"
          title="Admin Access (Ctrl+Shift+A)"
        >
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </QuoteProvider>
  );
}

export default App;
