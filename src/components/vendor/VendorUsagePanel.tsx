import React from "react";
import { BarChart3, Zap, TrendingUp, ArrowUpRight } from "lucide-react";
import { getVendorUsageSummary } from "@/services/vendorSubscriptionService";

// ============================================================================
// VENDOR USAGE PANEL — Surfaces getVendorUsageSummary() on the dashboard
// ============================================================================

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
  color?: "emerald" | "cyan" | "blue" | "amber";
}

function UsageMeter({ label, used, limit, unlimited, color = "emerald" }: UsageMeterProps) {
  const pct = unlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = !unlimited && limit > 0 && pct >= 80;
  const barColor = isNearLimit
    ? "bg-amber-500"
    : color === "cyan"
      ? "bg-cyan-500"
      : color === "blue"
        ? "bg-blue-500"
        : "bg-emerald-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-white/50">{label}</span>
        <span
          className={`text-xs font-semibold ${isNearLimit ? "text-amber-400" : "text-white/70"}`}
        >
          {unlimited
            ? `${used.toLocaleString()} (unlimited)`
            : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
          <div
            className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  bess: "BESS",
  solar: "Solar",
  wind: "Wind",
  inverters: "Inverters",
  transformers: "Transformers",
  generators: "Generators",
  ev_chargers: "EV Chargers",
  bos: "Balance of System",
  nuclear_smr: "Nuclear / SMR",
};

const TIER_DISPLAY: Record<string, { label: string; color: string }> = {
  vendor_starter: {
    label: "Starter",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  vendor_pro: { label: "Pro", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  vendor_enterprise: {
    label: "Enterprise",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
};

const VendorUsagePanel: React.FC = () => {
  const summary = getVendorUsageSummary();
  const tierInfo = TIER_DISPLAY[summary.tier] || TIER_DISPLAY.vendor_starter;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[#3ECF8E]" />
          <h3 className="text-lg font-bold text-white">Subscription Usage</h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${tierInfo.color}`}
          >
            {tierInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {summary.daysRemaining > 0 && (
            <span className="text-xs text-white/40">{summary.daysRemaining} days remaining</span>
          )}
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Upgrade
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="px-6 py-5 grid md:grid-cols-2 gap-x-8 gap-y-4">
        <UsageMeter
          label="Pricing Feed Updates"
          used={summary.pricingUpdates.used}
          limit={summary.pricingUpdates.limit}
          unlimited={summary.pricingUpdates.unlimited}
          color="emerald"
        />
        <UsageMeter
          label="API Calls"
          used={summary.apiCalls.used}
          limit={summary.apiCalls.limit}
          unlimited={summary.apiCalls.unlimited}
          color="cyan"
        />
        <UsageMeter
          label="RFQ Responses"
          used={summary.rfqResponses.used}
          limit={summary.rfqResponses.limit}
          unlimited={summary.rfqResponses.unlimited}
          color="blue"
        />
        <UsageMeter
          label="Equipment Categories"
          used={summary.categories.used}
          limit={summary.categories.limit}
          unlimited={summary.categories.unlimited}
          color="emerald"
        />
      </div>

      {/* Performance Stats */}
      <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-white/40">Impressions</span>
            <span className="text-xs font-semibold text-white/70">
              {summary.impressions.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-white/40">Click-throughs</span>
            <span className="text-xs font-semibold text-white/70">
              {summary.clickThroughs.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-white/40">Conversion</span>
            <span className="text-xs font-semibold text-white/70">{summary.conversionRate}</span>
          </div>
        </div>
        {/* Enabled Categories */}
        {summary.categories.enabled.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {summary.categories.enabled.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
              >
                {CATEGORY_LABELS[cat] || cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorUsagePanel;
