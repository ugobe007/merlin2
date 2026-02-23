import React from "react";
import { Clock, CheckCircle, FileText, TrendingUp, Calculator, Sparkles } from "lucide-react";
import type { Vendor, VendorProduct } from "@/services/supabaseClient";
import VendorUsagePanel from "../VendorUsagePanel";

interface DashboardStats {
  pendingProducts: number;
  approvedProducts: number;
  activeSubmissions: number;
  openRFQs: number;
  quotesThisMonth: number;
  unreadNotifications: number;
}

interface VendorDashboardTabProps {
  currentVendor: Vendor | null;
  vendorProducts: VendorProduct[];
  openRFQsCount: number;
  stats: DashboardStats | null;
  onGoToSubmitPricing: () => void;
}

const VendorDashboardTab: React.FC<VendorDashboardTabProps> = ({
  currentVendor,
  vendorProducts,
  openRFQsCount,
  stats,
  onGoToSubmitPricing,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">
        Welcome Back{currentVendor ? `, ${currentVendor.contact_name}` : ""}!
      </h2>

      {/* ── HERO: NREL-Compliant Quote Builder CTA ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-400 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>
        <div className="relative z-10 p-8 flex items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                  New
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25">
                <span className="text-[11px] font-semibold text-blue-300 tracking-wide">
                  NREL ATB 2024 Validated
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Build NREL-Compliant Quotes for Your Customers
            </h3>
            <p className="text-blue-200/70 text-sm leading-relaxed max-w-xl mb-5">
              Every number backed by NREL ATB 2024, IRA 2022 tax credits, and IEEE standards. Monte
              Carlo P10/P50/P90 risk analysis. Bank-ready exports. Your logo, our engine.
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
          <p className="text-3xl font-bold text-white">{stats?.openRFQs || openRFQsCount}</p>
        </div>

        <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400">Quotes This Month</p>
            <TrendingUp className="w-5 h-5 text-[#3ECF8E]" />
          </div>
          <p className="text-3xl font-bold text-white">{stats?.quotesThisMonth || 0}</p>
        </div>
      </div>

      {/* ── SUBSCRIPTION USAGE METERS (Feb 2026) ── */}
      <VendorUsagePanel />

      {/* Recent Submissions */}
      <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
        <h3 className="text-xl font-bold text-white mb-4">Recent Pricing Submissions</h3>
        {vendorProducts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products submitted yet.</p>
            <button
              onClick={onGoToSubmitPricing}
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
  );
};

export default VendorDashboardTab;
