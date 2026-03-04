import { useState, useEffect, lazy, Suspense } from "react";

// ─── Lazy-loaded routes (code-split per page) ───
const BessQuoteBuilder = lazy(() => import("./components/BessQuoteBuilder"));
const ProQuoteConfigurationPage = lazy(() => import("./pages/ProQuoteConfigurationPage"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const VendorPortal = lazy(() => import("./components/VendorPortal"));
const VendorAdminDashboard = lazy(() => import("./pages/admin/VendorAdminDashboard"));
const CarWashEnergy = lazy(() => import("./components/verticals/CarWashEnergy"));
const EVChargingEnergy = lazy(() => import("./components/verticals/EVChargingEnergy"));
const HotelEnergy = lazy(() => import("./components/verticals/HotelEnergy"));
const DataCenterEnergy = lazy(() => import("./components/verticals/DataCenterEnergy"));
const HospitalEnergy = lazy(() => import("./components/verticals/HospitalEnergy"));
const ManufacturingEnergy = lazy(() => import("./components/verticals/ManufacturingEnergy"));
const RetailEnergy = lazy(() => import("./components/verticals/RetailEnergy"));
const WarehouseEnergy = lazy(() => import("./components/verticals/WarehouseEnergy"));
const OfficeEnergy = lazy(() => import("./components/verticals/OfficeEnergy"));
const GasStationEnergy = lazy(() => import("./components/verticals/GasStationEnergy"));
const ColdStorageEnergy = lazy(() => import("./components/verticals/ColdStorageEnergy"));
const ShoppingCenterEnergy = lazy(() => import("./components/verticals/ShoppingCenterEnergy"));
const CasinoEnergy = lazy(() => import("./components/verticals/CasinoEnergy"));
const AirportEnergy = lazy(() => import("./components/verticals/AirportEnergy"));
const CollegeEnergy = lazy(() => import("./components/verticals/CollegeEnergy"));
const HomePage = lazy(() => import("./pages/HomePage"));
const LaunchPage = lazy(() => import("./pages/LaunchPage"));
const PressKit = lazy(() => import("./pages/PressKit"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const IconPreview = lazy(() => import("./pages/IconPreview"));
const TwitterBanner = lazy(() => import("./pages/TwitterBanner"));
const WizardV6 = lazy(() => import("./components/wizard/v6/WizardV6"));
const WizardV7Page = lazy(() => import("./pages/WizardV7Page"));
const WizardVNextPage = lazy(() => import("./pages/WizardVNextPage"));
const WizardV8Page = lazy(() => import("./wizard/v8/WizardV8Page"));
const MetaCalculationsPage = lazy(() => import("./pages/MetaCalculationsPage"));
const MarketIntelligencePage = lazy(() => import("./pages/MarketIntelligencePage"));
const QuoteTemplatePage = lazy(() => import("./pages/QuoteTemplatePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const SupportFAQ = lazy(() => import("./components/SupportFAQ"));
const PricingPage = lazy(() => import("./components/pricing/PricingPage"));
const CheckoutCallback = lazy(() => import("./components/pricing/CheckoutCallback"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
// const SharedQuotePage = lazy(() => import("./pages/SharedQuotePage")); // TEMP DISABLED
import { QuoteProvider } from "./contexts/QuoteContext";
import { trackPageView } from "./services/analyticsService";

// Test calculations temporarily disabled for production build
// import { testCalculations } from './utils/testCalculations';
// if (typeof window !== 'undefined') {
//   (window as any).testCalculations = testCalculations;
// }

/** Minimal full-page spinner shown while lazy chunks download */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}

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
  const isVendorAdminRoute = pathname === "/admin/vendors";

  const [showAdmin, setShowAdmin] = useState(isAdminRoute);
  const [showVendorPortal] = useState(isVendorPortalRoute);
  const [showVendorAdmin] = useState(isVendorAdminRoute);
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
                : pathname === "/data-center" || pathname === "/data-center-energy"
                  ? "datacenter"
                  : pathname === "/hospital" || pathname === "/hospital-energy"
                    ? "hospital"
                    : pathname === "/manufacturing" || pathname === "/manufacturing-energy"
                      ? "manufacturing"
                      : pathname === "/retail" || pathname === "/retail-energy"
                        ? "retail"
                        : pathname === "/warehouse" || pathname === "/warehouse-energy"
                          ? "warehouse"
                          : pathname === "/office" || pathname === "/office-energy"
                            ? "office"
                            : pathname === "/gas-station" || pathname === "/gas-station-energy"
                              ? "gasstation"
                              : pathname === "/cold-storage" || pathname === "/cold-storage-energy"
                                ? "coldstorage"
                                : pathname === "/shopping-center" || pathname === "/shopping-center-energy" || pathname === "/mall"
                                  ? "shoppingcenter"
                                  : pathname === "/casino" || pathname === "/casino-energy"
                                    ? "casino"
                                    : pathname === "/airport" || pathname === "/airport-energy"
                                      ? "airport"
                                      : pathname === "/college" || pathname === "/university" || pathname === "/college-energy"
                                        ? "college"
                                        : null)
  );

  // Track page view on every route
  useEffect(() => {
    trackPageView(pathname).catch(() => {});
  }, [pathname]);

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
      <Suspense fallback={<PageLoader />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  // Access via /admin/vendors - Vendor Admin Dashboard (Feb 2026)
  if (showVendorAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <VendorAdminDashboard />
      </Suspense>
    );
  }

  // Access via /vendor-portal or /vendor - Vendor Portal
  if (showVendorPortal) {
    return (
      <Suspense fallback={<PageLoader />}>
        <VendorPortal />
      </Suspense>
    );
  }

  // White-label verticals
  // Access via ?vertical=carwash or eventually carwashenergy.com
  if (activeVertical === "carwash") {
    return (
      <Suspense fallback={<PageLoader />}>
        <CarWashEnergy />
      </Suspense>
    );
  }

  // Access via ?vertical=evcharging or /evchargingenergy
  if (activeVertical === "evcharging") {
    return (
      <Suspense fallback={<PageLoader />}>
        <EVChargingEnergy />
      </Suspense>
    );
  }

  // Access via ?vertical=hotel or /hotelenergy
  if (activeVertical === "hotel") {
    return (
      <Suspense fallback={<PageLoader />}>
        <HotelEnergy />
      </Suspense>
    );
  }

  // Access via ?vertical=datacenter or /data-center or /data-center-energy
  if (activeVertical === "datacenter") {
    return (
      <Suspense fallback={<PageLoader />}>
        <DataCenterEnergy />
      </Suspense>
    );
  }

  // Access via ?vertical=hospital or /hospital or /hospital-energy
  if (activeVertical === "hospital") {
    return (
      <Suspense fallback={<PageLoader />}>
        <HospitalEnergy />
      </Suspense>
    );
  }

  // Access via ?vertical=manufacturing or /manufacturing or /manufacturing-energy
  if (activeVertical === "manufacturing") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ManufacturingEnergy />
      </Suspense>
    );
  }

  if (activeVertical === "retail") {
    return (<Suspense fallback={<PageLoader />}><RetailEnergy /></Suspense>);
  }
  if (activeVertical === "warehouse") {
    return (<Suspense fallback={<PageLoader />}><WarehouseEnergy /></Suspense>);
  }
  if (activeVertical === "office") {
    return (<Suspense fallback={<PageLoader />}><OfficeEnergy /></Suspense>);
  }
  if (activeVertical === "gasstation") {
    return (<Suspense fallback={<PageLoader />}><GasStationEnergy /></Suspense>);
  }
  if (activeVertical === "coldstorage") {
    return (<Suspense fallback={<PageLoader />}><ColdStorageEnergy /></Suspense>);
  }
  if (activeVertical === "shoppingcenter") {
    return (<Suspense fallback={<PageLoader />}><ShoppingCenterEnergy /></Suspense>);
  }
  if (activeVertical === "casino") {
    return (<Suspense fallback={<PageLoader />}><CasinoEnergy /></Suspense>);
  }
  if (activeVertical === "airport") {
    return (<Suspense fallback={<PageLoader />}><AirportEnergy /></Suspense>);
  }
  if (activeVertical === "college") {
    return (<Suspense fallback={<PageLoader />}><CollegeEnergy /></Suspense>);
  }

  // Access via /meta or /meta-calculations - TrueQuote Meta Calculations Dashboard
  if (pathname === "/meta" || pathname === "/meta-calculations" || pathname === "/ssot") {
    return (
      <Suspense fallback={<PageLoader />}>
        <MetaCalculationsPage />
      </Suspense>
    );
  }

  // Access via /support - Support & FAQ page
  if (pathname === "/support" || pathname === "/faq" || pathname === "/help") {
    return (
      <Suspense fallback={<PageLoader />}>
        <SupportFAQ standalone />
      </Suspense>
    );
  }

  // Access via /checkout or any route with ?checkout= — Stripe return handling
  if (pathname === "/checkout" || urlParams.get("checkout")) {
    return (
      <Suspense fallback={<PageLoader />}>
        <CheckoutCallback />
      </Suspense>
    );
  }

  // Access via /pricing - Pricing & Vendor API page
  if (pathname === "/pricing") {
    return (
      <Suspense fallback={<PageLoader />}>
        <PricingPage />
      </Suspense>
    );
  }

  // Access via /account - User subscription & billing management
  if (pathname === "/account" || pathname === "/billing" || pathname === "/subscription") {
    return (
      <Suspense fallback={<PageLoader />}>
        <AccountPage />
      </Suspense>
    );
  }

  // Access via /market-intelligence - Subscriber market reports
  if (
    pathname === "/market-intelligence" ||
    pathname === "/market" ||
    pathname === "/intelligence"
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MarketIntelligencePage />
      </Suspense>
    );
  }

  // Access via /templates or /brand-kit - Quote Template Builder
  if (pathname === "/templates" || pathname === "/brand-kit" || pathname === "/template-builder") {
    return (
      <Suspense fallback={<PageLoader />}>
        <QuoteTemplatePage />
      </Suspense>
    );
  }

  // Access via /wizard or /v8 - V8 PRODUCTION WIZARD (March 4, 2026 - NOW THE DEFAULT)
  if (
    pathname === "/wizard" ||
    pathname === "/wizard-v8" ||
    pathname === "/v8"
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <WizardV8Page />
      </Suspense>
    );
  }

  // Access via /wizard-v7 or /v7 - V7 Legacy (Feb 1, 2026)
  if (
    pathname === "/wizard-v7" ||
    pathname === "/v7" ||
    pathname === "/wizard/v7"
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <WizardV7Page />
      </Suspense>
    );
  }

  // Access via /wizard-v6 ONLY - V6 Legacy (kept for testing)
  if (pathname === "/wizard-v6") {
    return (
      <Suspense fallback={<PageLoader />}>
        <WizardV6 />
      </Suspense>
    );
  }

  // Access via /wizard-vnext or /vnext - vNext luminous HUD scaffold (Jan 30, 2026)
  if (pathname === "/wizard-vnext" || pathname === "/vnext") {
    return (
      <Suspense fallback={<PageLoader />}>
        <WizardVNextPage />
      </Suspense>
    );
  }

  // Access via /q/:shortCode - Shared quote viewer (public) - TEMP DISABLED
  // if (pathname.startsWith("/q/")) {
  //   return <Suspense fallback={<PageLoader />}><SharedQuotePage /></Suspense>;
  // }

  // Marketing home page
  if (pathname === "/home" || pathname === "/about") {
    return (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    );
  }

  // Product Hunt / HN launch page
  if (pathname === "/launch" || pathname === "/producthunt" || pathname === "/ph") {
    return (
      <Suspense fallback={<PageLoader />}>
        <LaunchPage />
      </Suspense>
    );
  }

  // Press & Promotion Kit — /press /kit /press-kit
  if (pathname === "/press" || pathname === "/kit" || pathname === "/promo" || pathname === "/press-kit") {
    return (
      <Suspense fallback={<PageLoader />}>
        <PressKit />
      </Suspense>
    );
  }

  // Referral landing page — /r/:handle
  if (pathname.startsWith("/r/") && pathname.length > 3) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ReferralPage />
      </Suspense>
    );
  }

  // Icon preview / design lab
  if (pathname === "/icon-preview" || pathname === "/icon-lab" || pathname === "/icon") {
    return (
      <Suspense fallback={<PageLoader />}>
        <IconPreview />
      </Suspense>
    );
  }

  // Analytics dashboard — password-gated
  if (pathname === "/analytics" || pathname === "/stats") {
    return (
      <Suspense fallback={<PageLoader />}>
        <AnalyticsDashboard />
      </Suspense>
    );
  }

  // Twitter / X banner generator
  if (pathname === "/banner" || pathname === "/twitter-banner") {
    return (
      <Suspense fallback={<PageLoader />}>
        <TwitterBanner />
      </Suspense>
    );
  }

  // Access via /quote-builder - ProQuote Configuration Page (AdvancedQuoteBuilder)
  if (
    pathname === "/quote-builder" ||
    pathname === "/proquote" ||
    (advancedParam === "true" && pathname !== "/")
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProQuoteConfigurationPage />
      </Suspense>
    );
  }

  return (
    <QuoteProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </QuoteProvider>
  );
}

export default App;
