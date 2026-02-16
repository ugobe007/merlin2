import React, { useState, useEffect } from "react";
import { Upload, FileText, DollarSign, CheckCircle, Clock, TrendingUp, Building2, AlertCircle, Loader2 } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "submit-pricing" | "rfqs" | "profile">(
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  // Login/Registration Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-5xl">🧙‍♂️</span>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Merlin Vendor Portal
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Partner with Merlin to provide competitive pricing for energy storage solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Login</h2>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, email: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="vendor@company.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <p className="text-center text-sm text-gray-600 mt-4">
                  <a href="#" className="text-purple-600 hover:underline">
                    Forgot password?
                  </a>
                </p>
              </form>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Why Partner with Merlin?</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Access to Active RFQs</h3>
                    <p className="text-white/90 text-sm">
                      Real-time notifications for projects matching your products
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Competitive Exposure</h3>
                    <p className="text-white/90 text-sm">
                      Your pricing included in thousands of quotes generated monthly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Streamlined Process</h3>
                    <p className="text-white/90 text-sm">
                      Simple pricing submission and proposal management
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Transparent Platform</h3>
                    <p className="text-white/90 text-sm">
                      Fair comparison based on price, lead time, and quality
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRegistration(true)}
                className="w-full bg-white text-purple-600 py-3 rounded-lg font-bold mt-8 hover:shadow-xl transition-all"
              >
                Become a Vendor Partner
              </button>
            </div>
          </div>

          {/* Registration Modal */}
          {showRegistration && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Registration</h2>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                )}

                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={registrationForm.company}
                        onChange={(e) => {
                          setRegistrationForm({ ...registrationForm, company: e.target.value });
                          setError(null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={registrationForm.contact_name}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, contact_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={registrationForm.email}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={registrationForm.phone}
                        onChange={(e) =>
                          setRegistrationForm({ ...registrationForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={registrationForm.password}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, password: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Website
                    </label>
                    <input
                      type="url"
                      value={registrationForm.website}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, website: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Description
                    </label>
                    <textarea
                      value={registrationForm.description}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                      className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧙‍♂️</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Merlin Vendor Portal
            </h1>
            {currentVendor && (
              <span className="text-sm text-gray-500 ml-2">({currentVendor.company_name})</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "submit-pricing", label: "Submit Pricing", icon: DollarSign },
              { id: "rfqs", label: "Active RFQs", icon: FileText },
              { id: "profile", label: "Profile", icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600 font-semibold"
                    : "border-transparent text-gray-600 hover:text-gray-800"
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
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome Back{currentVendor ? `, ${currentVendor.contact_name}` : ""}!
            </h2>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Pending Products</p>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats?.pendingProducts || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Approved Products</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats?.approvedProducts || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Open RFQs</p>
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.openRFQs || openRFQs.length}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Quotes This Month</p>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats?.quotesThisMonth || 0}</p>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Pricing Submissions</h3>
              {vendorProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products submitted yet.</p>
                  <button
                    onClick={() => setActiveTab("submit-pricing")}
                    className="mt-3 text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Submit your first product →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {product.product_category} - {product.model}
                        </p>
                        <p className="text-sm text-gray-600">
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Product Pricing</h2>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handlePricingSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category *
                </label>
                <select
                  value={pricingForm.product_category}
                  onChange={(e) => {
                    setPricingForm({ ...pricingForm, product_category: e.target.value as any });
                    setError(null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={pricingForm.manufacturer}
                    onChange={(e) => {
                      setPricingForm({ ...pricingForm, manufacturer: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., CATL, BYD, Tesla"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    value={pricingForm.model}
                    onChange={(e) => {
                      setPricingForm({ ...pricingForm, model: e.target.value });
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., LFP 280Ah"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.capacity_kwh}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, capacity_kwh: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Power Rating (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.power_kw}
                    onChange={(e) => setPricingForm({ ...pricingForm, power_kw: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per kWh (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kwh}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, price_per_kwh: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 145.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per kW (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kw}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, price_per_kw: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 180.00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (weeks) *
                  </label>
                  <input
                    type="number"
                    value={pricingForm.lead_time_weeks}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, lead_time_weeks: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty (years) *
                  </label>
                  <input
                    type="number"
                    value={pricingForm.warranty_years}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, warranty_years: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <input
                  type="text"
                  value={pricingForm.certifications}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, certifications: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., UL9540, IEC 62619, UN38.3"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Datasheet (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, datasheet: e.target.files?.[0] || null })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h2 className="text-3xl font-bold text-gray-800">Active RFQs</h2>

            {openRFQs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Open RFQs</h3>
                <p className="text-gray-600">
                  There are no active requests for quotes at the moment. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {openRFQs.map((rfq) => (
                  <div key={rfq.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-purple-600 font-semibold">{rfq.rfq_number}</p>
                        <h3 className="text-xl font-bold text-gray-800 mt-1">{rfq.project_name}</h3>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {rfq.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">System Size</p>
                        <p className="font-semibold text-gray-800">
                          {rfq.system_size_mw} MW / {rfq.system_size_mw * rfq.duration_hours} MWh
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold text-gray-800">{rfq.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(rfq.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                        Submit Proposal
                      </button>
                      <button className="px-6 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && currentVendor && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Profile</h2>

            {/* Status Badge */}
            <div className="mb-6">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  currentVendor.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : currentVendor.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                Account Status: {currentVendor.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={currentVendor.company_name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={currentVendor.contact_name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={currentVendor.email}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={currentVendor.phone || "Not provided"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                  <input
                    type="text"
                    value={currentVendor.specialty.replace("_", " ").toUpperCase()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="text"
                    value={currentVendor.website || "Not provided"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              {currentVendor.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={currentVendor.description}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    rows={4}
                    readOnly
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Member since: {new Date(currentVendor.created_at).toLocaleDateString()}
                </p>
                {currentVendor.last_login && (
                  <p className="text-sm text-gray-500">
                    Last login: {new Date(currentVendor.last_login).toLocaleString()}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 italic">
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
