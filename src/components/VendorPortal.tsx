import React, { useState, useEffect } from "react";
import { Upload, FileText, DollarSign, CheckCircle, Clock, TrendingUp, Building2, AlertCircle, Loader2, Calculator, Sparkles, ShieldCheck } from "lucide-react";
import merlinIcon from "@/assets/images/new_small_profile_.png";
import badgeIcon from "@/assets/images/badge_icon.jpg";
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

interface PricingSubmission {
  id: string;
  product_category: string;
  model: string;
  price_per_kwh?: number;
  price_per_kw?: number;
  lead_time_weeks: number;
  warranty_years: number;
  status: "pending" | "approved" | "rejected";
  submitted_date: string;
}

const VendorPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "submit-pricing" | "rfqs" | "build-quote" | "profile">(
    "dashboard"
  );
  const [showRegistration, setShowRegistration] = useState(false);

  // Dashboard data
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

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registrationForm, setRegistrationForm] = useState({
    company: "",
    contact_name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "" as "battery" | "inverter" | "ems" | "bos" | "epc" | "integrator" | "",
    website: "",
    description: "",
  });

  const [pricingForm, setPricingForm] = useState({
    product_category: "battery" as "battery" | "inverter" | "ems" | "bos" | "container",
    manufacturer: "",
    model: "",
    capacity_kwh: "",
    power_kw: "",
    price_per_kwh: "",
    price_per_kw: "",
    lead_time_weeks: "",
    warranty_years: "",
    certifications: "",
    datasheet: null as File | null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const vendor = await getCurrentVendor();
        if (vendor) {
          setCurrentVendor(vendor as any);
          setIsLoggedIn(true);
          await loadDashboardData();
        }
      } catch (err) {
        // No session, that's fine
        console.log("No active vendor session");
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Load dashboard data when logged in
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginVendor({
        email: loginForm.email,
        password: loginForm.password,
      });

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
          "Registration submitted successfully! Your account is pending approval. You'll receive an email confirmation once approved."
        );
        setShowRegistration(false);
        setRegistrationForm({
          company: "",
          contact_name: "",
          email: "",
          phone: "",
          password: "",
          specialty: "",
          website: "",
          description: "",
        });
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

      alert(
        "Pricing submitted successfully! Our team will review and update our pricing database within 48 hours."
      );
      setPricingForm({
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
      });

      // Reload products
      const products = await getVendorProducts();
      setVendorProducts(products);
    } catch (err: any) {
      setError(err.message || "Failed to submit pricing");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking session
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

  // Login/Registration Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0f1117] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-4">
              {/* ProQuote Blue Shield Badge */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <img src={badgeIcon} alt="ProQuote" className="w-16 h-16 rounded-xl object-cover" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[#0f1117]">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Pro<span className="text-[#3ECF8E]">Quote</span>™
                </h1>
                <p className="text-sm text-slate-400 font-medium">Vendor Partner Portal</p>
              </div>
            </div>
            <p className="text-xl text-slate-400">
              Partner with Merlin to provide competitive pricing for energy storage solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Section */}
            <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3 mb-6">
                <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
                <h2 className="text-2xl font-bold text-white">Vendor Login</h2>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, email: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50 transition-colors"
                    placeholder="vendor@company.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50 transition-colors"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <p className="text-center text-sm text-slate-500 mt-4">
                  <a href="#" className="text-[#3ECF8E] hover:underline">
                    Forgot password?
                  </a>
                </p>
              </form>
            </div>

            {/* Benefits Section */}
            <div className="rounded-xl p-8 border border-[#3ECF8E]/20 bg-gradient-to-br from-[#3ECF8E]/[0.06] to-transparent">
              <h2 className="text-2xl font-bold text-white mb-6">Why Partner with Merlin?</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-white">Access to Active RFQs</h3>
                    <p className="text-slate-400 text-sm">
                      Real-time notifications for projects matching your products
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-white">Competitive Exposure</h3>
                    <p className="text-slate-400 text-sm">
                      Your pricing included in thousands of quotes generated monthly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-white">Streamlined Process</h3>
                    <p className="text-slate-400 text-sm">
                      Simple pricing submission and proposal management
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-white">Transparent Platform</h3>
                    <p className="text-slate-400 text-sm">
                      Fair comparison based on price, lead time, and quality
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRegistration(true)}
                className="w-full border-2 border-[#3ECF8E] text-[#3ECF8E] hover:bg-[#3ECF8E]/10 py-3 rounded-lg font-bold mt-8 transition-all"
              >
                Become a Vendor Partner
              </button>
            </div>
          </div>

          {/* Registration Modal */}
          {showRegistration && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1c23] border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div className="flex items-center gap-3 mb-6">
                  <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
                  <h2 className="text-2xl font-bold text-white">Vendor Registration</h2>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-red-300 text-sm">{error}</div>
                  </div>
                )}

                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={registrationForm.company}
                        onChange={(e) => {
                          setRegistrationForm({ ...registrationForm, company: e.target.value });
                          setError(null);
                        }}
                        className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={registrationForm.contact_name}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, contact_name: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={registrationForm.email}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={registrationForm.phone}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={registrationForm.password}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, password: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Specialty/Product Category *
                    </label>
                    <select
                      value={registrationForm.specialty}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          specialty: e.target.value as typeof registrationForm.specialty,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="battery">Battery Manufacturer</option>
                      <option value="inverter">Inverter/PCS Manufacturer</option>
                      <option value="ems">EMS Software Provider</option>
                      <option value="bos">Balance of System</option>
                      <option value="epc">EPC Contractor</option>
                      <option value="integrator">System Integrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Website
                    </label>
                    <input
                      type="url"
                      value={registrationForm.website}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, website: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Description
                    </label>
                    <textarea
                      value={registrationForm.description}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, description: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      rows={4}
                      placeholder="Tell us about your company and products..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegistration(false);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="flex-1 bg-white/[0.06] text-slate-300 py-3 rounded-lg font-semibold hover:bg-white/[0.1] border border-white/[0.1] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Submit Registration"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vendor Dashboard (After Login)
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
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">Vendor Portal</span>
            {currentVendor && (
              <span className="text-sm text-slate-400 ml-2">({currentVendor.company_name})</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#1a1c23] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "submit-pricing", label: "Submit Pricing", icon: DollarSign },
              { id: "rfqs", label: "Active RFQs", icon: FileText },
              { id: "build-quote", label: "Build a Quote", icon: Calculator },
              { id: "profile", label: "Profile", icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Welcome Back{currentVendor ? `, ${currentVendor.contact_name}` : ""}!
            </h2>

            {/* ── HERO: NREL-Compliant Quote Builder CTA ── */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
              <div className="absolute inset-0 opacity-[0.07]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-400 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
              </div>
              <div className="relative z-10 p-8 flex items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">New</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25">
                      <span className="text-[11px] font-semibold text-blue-300 tracking-wide">NREL ATB 2024 Validated</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    Build NREL-Compliant Quotes for Your Customers
                  </h3>
                  <p className="text-blue-200/70 text-sm leading-relaxed max-w-xl mb-5">
                    Every number backed by NREL ATB 2024, IRA 2022 tax credits, and IEEE standards.
                    Monte Carlo P10/P50/P90 risk analysis. Bank-ready exports. Your logo, our engine.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/quote-builder"
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-colors no-underline shadow-lg shadow-emerald-500/20"
                    >
                      <Calculator className="w-5 h-5" />
                      Open ProQuote™ Builder
                    </a>
                    <a
                      href="/wizard"
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-semibold transition-colors border border-white/20 no-underline"
                    >
                      Quick Estimate →
                    </a>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col gap-2 text-right shrink-0">
                  <div className="flex items-center gap-2 text-xs text-blue-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NREL ATB 2024 pricing benchmarks</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>IRA 2022 ITC/PTC dynamic calculator</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>IEEE/ASHRAE engineering standards</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>10,000-iteration Monte Carlo analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>8,760-hour dispatch simulation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400">Pending Products</p>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.pendingProducts || 0}</p>
              </div>

              <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400">Approved Products</p>
                  <CheckCircle className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.approvedProducts || 0}</p>
              </div>

              <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400">Open RFQs</p>
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats?.openRFQs || openRFQs.length}
                </p>
              </div>

              <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400">Quotes This Month</p>
                  <TrendingUp className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.quotesThisMonth || 0}</p>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <h3 className="text-xl font-bold text-white mb-4">Recent Pricing Submissions</h3>
              {vendorProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products submitted yet.</p>
                  <button
                    onClick={() => setActiveTab("submit-pricing")}
                    className="mt-3 text-[#3ECF8E] hover:text-[#35b87a] font-semibold"
                  >
                    Submit your first product →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {product.product_category} - {product.model}
                        </p>
                        <p className="text-sm text-slate-400">
                          {product.price_per_kwh ? `$${product.price_per_kwh}/kWh` : ""}
                          {product.price_per_kwh && product.price_per_kw ? " • " : ""}
                          {product.price_per_kw ? `$${product.price_per_kw}/kW` : ""} •
                          {product.lead_time_weeks} weeks •{product.warranty_years}yr warranty
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : product.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Pricing Tab */}
        {activeTab === "submit-pricing" && (
          <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <h2 className="text-2xl font-bold text-white mb-6">Submit Product Pricing</h2>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handlePricingSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Category *
                </label>
                <select
                  value={pricingForm.product_category}
                  onChange={(e) => {
                    setPricingForm({ ...pricingForm, product_category: e.target.value as any });
                    setError(null);
                  }}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                  required
                  disabled={isLoading}
                >
                  <option value="battery">Battery Module</option>
                  <option value="inverter">Inverter/PCS</option>
                  <option value="ems">Energy Management System</option>
                  <option value="bos">Balance of System</option>
                  <option value="container">Container/Enclosure</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={pricingForm.manufacturer}
                    onChange={(e) => {
                      setPricingForm({ ...pricingForm, manufacturer: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    placeholder="e.g., CATL, BYD, Tesla"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    value={pricingForm.model}
                    onChange={(e) => {
                      setPricingForm({ ...pricingForm, model: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    placeholder="e.g., LFP 280Ah"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.capacity_kwh}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, capacity_kwh: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Power Rating (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.power_kw}
                    onChange={(e) => setPricingForm({ ...pricingForm, power_kw: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price per kWh (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kwh}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, price_per_kwh: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    placeholder="e.g., 145.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price per kW (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kw}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, price_per_kw: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    placeholder="e.g., 180.00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Lead Time (weeks) *
                  </label>
                  <input
                    type="number"
                    value={pricingForm.lead_time_weeks}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, lead_time_weeks: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Warranty (years) *
                  </label>
                  <input
                    type="number"
                    value={pricingForm.warranty_years}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, warranty_years: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Certifications
                </label>
                <input
                  type="text"
                  value={pricingForm.certifications}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, certifications: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                  placeholder="e.g., UL9540, IEC 62619, UN38.3"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Datasheet (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, datasheet: e.target.files?.[0] || null })
                  }
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3ECF8E]/20 file:text-[#3ECF8E] hover:file:bg-[#3ECF8E]/30 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Pricing
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* RFQs Tab */}
        {activeTab === "rfqs" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Active RFQs</h2>

            {openRFQs.length === 0 ? (
              <div className="rounded-xl p-8 text-center border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Open RFQs</h3>
                <p className="text-slate-400">
                  There are no active requests for quotes at the moment. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {openRFQs.map((rfq) => (
                  <div key={rfq.id} className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-[#3ECF8E] font-semibold">{rfq.rfq_number}</p>
                        <h3 className="text-xl font-bold text-white mt-1">{rfq.project_name}</h3>
                      </div>
                      <span className="px-3 py-1 bg-[#3ECF8E]/10 text-[#3ECF8E] rounded-full text-sm font-semibold border border-[#3ECF8E]/20">
                        {rfq.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400">System Size</p>
                        <p className="font-semibold text-white">
                          {rfq.system_size_mw} MW / {rfq.system_size_mw * rfq.duration_hours} MWh
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Location</p>
                        <p className="font-semibold text-white">{rfq.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Due Date</p>
                        <p className="font-semibold text-white">
                          {new Date(rfq.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-2 rounded-lg font-bold transition-colors">
                        Submit Proposal
                      </button>
                      <button className="px-6 bg-white/[0.06] text-slate-300 py-2 rounded-lg font-semibold hover:bg-white/[0.1] border border-white/[0.1] transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Build a Quote Tab — ProQuote for Vendors */}
        {activeTab === "build-quote" && (
          <div className="space-y-6">
            {/* Hero CTA */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">ProQuote™ for Vendors</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-blue-400/15 border border-blue-400/25">
                    <span className="text-[11px] font-semibold text-blue-300 tracking-wide">NREL ATB 2024 · IRA 2022 · IEEE</span>
                  </div>
                </div>
                <h2 className="text-3xl font-black mb-3">
                  Build NREL-Compliant Proposals — Your Logo, Our Engine
                </h2>
                <p className="text-blue-200/80 text-lg mb-6 max-w-2xl">
                  Every line item traced to NREL, DOE, or IEEE sources. Monte Carlo P10/P50/P90 risk analysis,
                  8,760-hour dispatch modeling, IRA 2022 ITC optimization — ready for bank due diligence.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/quote-builder"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors no-underline"
                  >
                    <Calculator className="w-5 h-5" />
                    Open ProQuote™ Builder
                  </a>
                  <a
                    href="/wizard"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-white/20 no-underline"
                  >
                    Quick Estimate (Wizard)
                  </a>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04]">
                <div className="w-10 h-10 bg-[#3ECF8E]/10 rounded-lg flex items-center justify-center mb-3">
                  <Calculator className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <h3 className="font-bold text-white mb-2">Full Engineering Control</h3>
                <p className="text-sm text-slate-400">
                  Configure BESS, solar, generators, EV chargers, and fuel cells with your own specs and pricing.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-blue-500/20 bg-blue-500/[0.04]">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Advanced Financial Analysis</h3>
                <p className="text-sm text-slate-400">
                  Monte Carlo P10/P50/P90, 8760 hourly dispatch, NPV/IRR, DSCR — ready for bank review.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Branded Exports</h3>
                <p className="text-sm text-slate-400">
                  Export Word, Excel, and PDF proposals with TrueQuote™ source attribution — your client sees the rigor.
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: "1", title: "Enter Project Specs", desc: "System size, location, use case, and customer requirements" },
                  { step: "2", title: "Set Your Pricing", desc: "Use your equipment pricing or let Merlin suggest market rates" },
                  { step: "3", title: "Run Analysis", desc: "Monte Carlo, 8760 hourly, degradation modeling — automated" },
                  { step: "4", title: "Export Proposal", desc: "Bank-ready PDF/Word with TrueQuote™ attribution" },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 bg-[#3ECF8E] text-[#0f1117] rounded-full flex items-center justify-center font-bold mx-auto mb-2">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Tiers Preview */}
            <div className="rounded-xl p-6 border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1">Vendor Quoting Plans</h3>
                  <p className="text-sm text-slate-400">
                    Free: 3 quotes/month with Merlin watermark • Pro: Unlimited quotes, white-label exports
                  </p>
                </div>
                <a
                  href="/quote-builder"
                  className="inline-flex items-center gap-2 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] px-5 py-2.5 rounded-lg font-bold transition-colors text-sm no-underline"
                >
                  Start Building →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && currentVendor && (
          <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <h2 className="text-2xl font-bold text-white mb-6">Vendor Profile</h2>

            {/* Status Badge */}
            <div className="mb-6">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  currentVendor.status === "approved"
                    ? "bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20"
                    : currentVendor.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                Account Status: {currentVendor.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={currentVendor.company_name}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={currentVendor.contact_name}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={currentVendor.email}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={currentVendor.phone || "Not provided"}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Specialty</label>
                  <input
                    type="text"
                    value={currentVendor.specialty.replace("_", " ").toUpperCase()}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    type="text"
                    value={currentVendor.website || "Not provided"}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    readOnly
                  />
                </div>
              </div>

              {currentVendor.description && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={currentVendor.description}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
                    rows={4}
                    readOnly
                  />
                </div>
              )}

              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-sm text-slate-500">
                  Member since: {new Date(currentVendor.created_at).toLocaleDateString()}
                </p>
                {currentVendor.last_login && (
                  <p className="text-sm text-slate-500">
                    Last login: {new Date(currentVendor.last_login).toLocaleString()}
                  </p>
                )}
              </div>

              <p className="text-sm text-slate-500 italic">
                To update your profile information, please contact support at vendors@merlin.energy
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPortal;
