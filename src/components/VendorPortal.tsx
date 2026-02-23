import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Calculator,
  Building2,
  ShieldCheck,
  Loader2,
  Home,
} from "lucide-react";
import merlinIcon from "@/assets/images/new_small_profile_.png";
import {
  registerVendor,
  loginVendor,
  logoutVendor,
  getCurrentVendor,
  submitProduct,
  getVendorProducts,
  getOpenRFQs,
  getVendorStats,
  type VendorRegistrationData,
  type ProductSubmissionData,
} from "@/services/vendorService";
import type { Vendor, VendorProduct, RFQ } from "@/services/supabaseClient";

import VendorLoginScreen from "./vendor/VendorLoginScreen";
import VendorDashboardTab from "./vendor/tabs/VendorDashboardTab";
import VendorSubmitPricingTab from "./vendor/tabs/VendorSubmitPricingTab";
import VendorRFQsTab from "./vendor/tabs/VendorRFQsTab";
import VendorBuildQuoteTab from "./vendor/tabs/VendorBuildQuoteTab";
import VendorProfileTab from "./vendor/tabs/VendorProfileTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "dashboard" | "submit-pricing" | "rfqs" | "build-quote" | "profile";

interface PricingForm {
  product_category: "battery" | "inverter" | "ems" | "bos" | "container";
  manufacturer: string;
  model: string;
  capacity_kwh: string;
  power_kw: string;
  price_per_kwh: string;
  price_per_kw: string;
  lead_time_weeks: string;
  warranty_years: string;
  certifications: string;
  datasheet: File | null;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegistrationForm {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  password: string;
  specialty: "battery" | "inverter" | "ems" | "bos" | "epc" | "integrator" | "";
  website: string;
  description: string;
}

const INITIAL_PRICING_FORM: PricingForm = {
  product_category: "battery",
  manufacturer: "",
  model: "",
  capacity_kwh: "",
  power_kw: "",
  price_per_kwh: "",
  price_per_kw: "",
  lead_time_weeks: "",
  warranty_years: "",
  certifications: "",
  datasheet: null,
};

const INITIAL_REGISTRATION_FORM: RegistrationForm = {
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  password: "",
  specialty: "",
  website: "",
  description: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

const VendorPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [showRegistration, setShowRegistration] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [openRFQs, setOpenRFQs] = useState<RFQ[]>([]);
  const [stats, setStats] = useState<{
    pendingProducts: number;
    approvedProducts: number;
    activeSubmissions: number;
    openRFQs: number;
    quotesThisMonth: number;
    unreadNotifications: number;
  } | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" });
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationForm>(INITIAL_REGISTRATION_FORM);
  const [pricingForm, setPricingForm] = useState<PricingForm>(INITIAL_PRICING_FORM);

  // ─── Session ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkSession = async () => {
      try {
        const vendor = await getCurrentVendor();
        if (vendor) {
          setCurrentVendor(vendor as any);
          setIsLoggedIn(true);
          await loadDashboardData();
        }
      } catch {
        console.log("No active vendor session");
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, rfqs, vendorStats] = await Promise.all([
        getVendorProducts(),
        getOpenRFQs(),
        getVendorStats(),
      ]);
      setVendorProducts(products as any);
      setOpenRFQs(rfqs as any);
      setStats(vendorStats as any);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await loginVendor({ email: loginForm.email, password: loginForm.password });
      if (result.success && result.vendor) {
        setCurrentVendor(result.vendor as any);
        setIsLoggedIn(true);
        await loadDashboardData();
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutVendor();
      setIsLoggedIn(false);
      setCurrentVendor(null);
      setVendorProducts([]);
      setOpenRFQs([]);
      setStats(null);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !registrationForm.company ||
      !registrationForm.email ||
      !registrationForm.contact_name ||
      !registrationForm.password ||
      !registrationForm.specialty
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (registrationForm.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const registrationData: VendorRegistrationData = {
        company_name: registrationForm.company,
        contact_name: registrationForm.contact_name,
        email: registrationForm.email,
        phone: registrationForm.phone || undefined,
        password: registrationForm.password,
        specialty: registrationForm.specialty as VendorRegistrationData["specialty"],
        website: registrationForm.website || undefined,
        description: registrationForm.description || undefined,
      };
      const result = await registerVendor(registrationData);
      if (result.success) {
        alert(
          "Registration submitted! Your account is pending approval. " +
            "You will receive an email confirmation once approved."
        );
        setShowRegistration(false);
        setRegistrationForm(INITIAL_REGISTRATION_FORM);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pricingForm.manufacturer || !pricingForm.model) {
      setError("Please fill in manufacturer and model");
      return;
    }
    if (!pricingForm.price_per_kwh && !pricingForm.price_per_kw) {
      setError("Please provide either price per kWh or price per kW");
      return;
    }
    if (!pricingForm.lead_time_weeks || !pricingForm.warranty_years) {
      setError("Please provide lead time and warranty information");
      return;
    }
    setIsLoading(true);
    try {
      const productData: ProductSubmissionData = {
        product_category: pricingForm.product_category,
        manufacturer: pricingForm.manufacturer,
        model: pricingForm.model,
        capacity_kwh: pricingForm.capacity_kwh ? parseFloat(pricingForm.capacity_kwh) : undefined,
        power_kw: pricingForm.power_kw ? parseFloat(pricingForm.power_kw) : undefined,
        price_per_kwh: pricingForm.price_per_kwh
          ? parseFloat(pricingForm.price_per_kwh)
          : undefined,
        price_per_kw: pricingForm.price_per_kw ? parseFloat(pricingForm.price_per_kw) : undefined,
        lead_time_weeks: parseInt(pricingForm.lead_time_weeks),
        warranty_years: parseInt(pricingForm.warranty_years),
        certifications: pricingForm.certifications
          ? pricingForm.certifications.split(",").map((c) => c.trim())
          : undefined,
      };
      await submitProduct(productData);
      alert("Pricing submitted! Our team will review and update pricing within 48 hours.");
      setPricingForm(INITIAL_PRICING_FORM);
      const products = await getVendorProducts();
      setVendorProducts(products);
    } catch (err: any) {
      setError(err.message || "Failed to submit pricing");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading && !isLoggedIn && !showRegistration) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3ECF8E] animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading ProQuote™ portal...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <VendorLoginScreen
        error={error}
        isLoading={isLoading}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registrationForm={registrationForm}
        setRegistrationForm={setRegistrationForm}
        showRegistration={showRegistration}
        setShowRegistration={setShowRegistration}
        onLogin={handleLogin}
        onRegister={handleRegistration}
        onClearError={() => setError(null)}
      />
    );
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "submit-pricing", label: "Submit Pricing", icon: DollarSign },
    { id: "rfqs", label: "Active RFQs", icon: FileText },
    { id: "build-quote", label: "Build a Quote", icon: Calculator },
    { id: "profile", label: "Profile", icon: Building2 },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <div className="bg-[#1a1c23] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={merlinIcon} alt="Merlin" className="w-10 h-10 rounded-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[#1a1c23]">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Pro<span className="text-[#3ECF8E]">Quote</span>™
            </h1>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
              Vendor Portal
            </span>
            {currentVendor && (
              <span className="text-sm text-slate-400 ml-2">({currentVendor.company_name})</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white font-semibold transition-colors"
            >
              Sign Out
            </button>
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm rounded-lg font-medium transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </a>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-[#1a1c23] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#3ECF8E] text-[#3ECF8E] font-semibold"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && (
          <VendorDashboardTab
            currentVendor={currentVendor}
            vendorProducts={vendorProducts}
            openRFQsCount={openRFQs.length}
            stats={stats}
            onGoToSubmitPricing={() => setActiveTab("submit-pricing")}
          />
        )}
        {activeTab === "submit-pricing" && (
          <VendorSubmitPricingTab
            pricingForm={pricingForm}
            setPricingForm={setPricingForm}
            error={error}
            isLoading={isLoading}
            onSubmit={handlePricingSubmit}
            onClearError={() => setError(null)}
          />
        )}
        {activeTab === "rfqs" && <VendorRFQsTab openRFQs={openRFQs} />}
        {activeTab === "build-quote" && <VendorBuildQuoteTab />}
        {activeTab === "profile" && currentVendor && (
          <VendorProfileTab currentVendor={currentVendor} />
        )}
      </div>
    </div>
  );
};

export default VendorPortal;
