import { useState, useEffect } from "react";
import {
  BarChart3,
  Key,
  Copy,
  Check,
  RefreshCw,
  Settings,
  TrendingUp,
  Zap,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Partner {
  id: string;
  company_name: string;
  contact_email: string;
  tier: "free" | "pro" | "enterprise";
  api_key: string;
  monthly_quote_limit: number;
  current_month_quotes: number;
  total_quotes_generated: number;
  primary_color: string;
  logo_url: string | null;
  hide_attribution: boolean;
  status: string;
  created_at: string;
}

interface UsageStats {
  widget_loads: number;
  quotes_generated: number;
  quotes_failed: number;
  errors: number;
  conversion_rate_pct: number;
  industries_used: string[];
}

export default function PartnerDashboard() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [customColor, setCustomColor] = useState("#3ecf8e");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock API key for demo (in production, this would come from Supabase auth)
  const demoApiKey = "pk_test_pro_demo_98765432109876543210";

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    // In production, this would be a real Supabase query
    // const { data: partnerData } = await supabase
    //   .from('widget_partners')
    //   .select('*')
    //   .eq('api_key', apiKey)
    //   .single();

    // Mock data for demo
    setTimeout(() => {
      setPartner({
        id: "123e4567-e89b-12d3-a456-426614174000",
        company_name: "Hotel Energy Solutions Pro",
        contact_email: "demo@hotelenergy.com",
        tier: "pro",
        api_key: demoApiKey,
        monthly_quote_limit: 500,
        current_month_quotes: 342,
        total_quotes_generated: 4567,
        primary_color: "#3ecf8e",
        logo_url: null,
        hide_attribution: true,
        status: "active",
        created_at: "2026-01-15T10:30:00Z",
      });

      setUsageStats({
        widget_loads: 1243,
        quotes_generated: 342,
        quotes_failed: 12,
        errors: 3,
        conversion_rate_pct: 27.5,
        industries_used: ["hotel", "office", "retail"],
      });

      setCustomColor("#3ecf8e");
      setLoading(false);
    }, 800);
  };

  const handleCopyApiKey = () => {
    if (partner) {
      navigator.clipboard.writeText(partner.api_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRegenerateKey = () => {
    // In production: Call Supabase function to regenerate key
    setShowRegenerateModal(false);
    alert("API key regenerated successfully! (Demo mode)");
  };

  const handleSaveCustomization = () => {
    // In production: Update widget_partners table in Supabase
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">Please log in to view your dashboard</p>
          <a
            href="/widget"
            className="px-6 py-2.5 bg-[#3ecf8e] hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors inline-block"
          >
            Back to Widget Demo
          </a>
        </div>
      </div>
    );
  }

  const quotesRemaining = partner.monthly_quote_limit - partner.current_month_quotes;
  const usagePercentage = (partner.current_month_quotes / partner.monthly_quote_limit) * 100;

  const tierConfig = {
    free: { name: "Free", color: "text-gray-400", bgColor: "bg-gray-700/30", price: "$0/mo" },
    pro: { name: "Pro", color: "text-[#3ecf8e]", bgColor: "bg-[#3ecf8e]/10", price: "$99/mo" },
    enterprise: {
      name: "Enterprise",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      price: "$499/mo",
    },
  };

  const currentTier = tierConfig[partner.tier];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#151515] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{partner.company_name}</h1>
              <p className="text-gray-400 mt-1">{partner.contact_email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 ${currentTier.bgColor} rounded-lg`}>
                <span className={`text-sm font-semibold ${currentTier.color}`}>
                  {currentTier.name} Plan
                </span>
                <span className="text-xs text-gray-400 ml-2">{currentTier.price}</span>
              </div>
              <a
                href="/widget"
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 rounded-lg transition-colors"
              >
                View Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Quotes Used */}
          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-[#3ecf8e]" />
              <span className="text-2xl font-bold text-white">{partner.current_month_quotes}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Quotes Used</h3>
            <div className="w-full bg-[#1a1a1a] rounded-full h-2 mb-2">
              <div
                className="bg-[#3ecf8e] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {quotesRemaining} of {partner.monthly_quote_limit} remaining
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {usageStats?.conversion_rate_pct}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Conversion Rate</h3>
            <p className="text-xs text-gray-500">
              {usageStats?.quotes_generated} quotes from {usageStats?.widget_loads} loads
            </p>
          </div>

          {/* Total Quotes */}
          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {partner.total_quotes_generated.toLocaleString()}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Total Quotes</h3>
            <p className="text-xs text-gray-500">All-time generated</p>
          </div>

          {/* Error Rate */}
          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold text-white">{usageStats?.errors || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Errors</h3>
            <p className="text-xs text-gray-500">{usageStats?.quotes_failed} failed quotes</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - API Key & Usage */}
          <div className="md:col-span-2 space-y-8">
            {/* API Key Management */}
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-[#3ecf8e]" />
                <h2 className="text-xl font-semibold text-white">API Key</h2>
              </div>

              <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-300 font-mono flex-1">{partner.api_key}</code>
                  <button
                    onClick={handleCopyApiKey}
                    className="ml-4 p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedKey ? (
                      <Check className="w-4 h-4 text-[#3ecf8e]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Created on {new Date(partner.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Keep your API key secret. Do not share it publicly.
                  </p>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Usage Analytics */}
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-[#3ecf8e]" />
                <h2 className="text-xl font-semibold text-white">Usage This Month</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Widget Loads</span>
                  <span className="text-white font-semibold">
                    {usageStats?.widget_loads.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Quotes Generated</span>
                  <span className="text-white font-semibold">
                    {usageStats?.quotes_generated.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Failed Quotes</span>
                  <span className="text-orange-400 font-semibold">{usageStats?.quotes_failed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Industries Used</span>
                  <div className="flex gap-2">
                    {usageStats?.industries_used.map((industry) => (
                      <span
                        key={industry}
                        className="px-2 py-1 bg-[#1a1a1a] text-xs text-gray-300 rounded"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <a
                href="/widget/docs"
                className="mt-6 w-full px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Integration Docs
              </a>
            </div>
          </div>

          {/* Right Column - Customization & Billing */}
          <div className="space-y-8">
            {/* Widget Customization */}
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-[#3ecf8e]" />
                <h2 className="text-xl font-semibold text-white">Customization</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-12 h-10 rounded border border-[#1a1a1a] bg-[#1a1a1a] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#252525] rounded-lg text-gray-300 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
                      placeholder="#3ecf8e"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#252525] rounded-lg text-gray-300 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
                    placeholder="https://yoursite.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG or SVG recommended</p>
                </div>

                {partner.tier !== "free" && (
                  <div className="flex items-center justify-between py-3 border-t border-[#1a1a1a]">
                    <span className="text-sm text-gray-400">Hide Attribution</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={partner.hide_attribution}
                        className="w-4 h-4 rounded bg-[#1a1a1a] border-[#252525] text-[#3ecf8e] focus:ring-[#3ecf8e]"
                        disabled
                      />
                      <span className="text-xs text-gray-500">Enabled</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveCustomization}
                  className="w-full px-4 py-2.5 bg-[#3ecf8e] hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                >
                  {saveSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Saved!
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>

            {/* Upgrade CTA (if not enterprise) */}
            {partner.tier !== "enterprise" && (
              <div className="bg-gradient-to-br from-[#3ecf8e]/10 to-blue-500/10 rounded-xl border border-[#3ecf8e]/30 p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {partner.tier === "free" ? "Upgrade to Pro" : "Upgrade to Enterprise"}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {partner.tier === "free"
                    ? "500 quotes/month, hide attribution, priority support"
                    : "Unlimited quotes, white-label, custom integration"}
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-white">
                    {partner.tier === "free" ? "$99" : "$499"}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                <button className="w-full px-4 py-2.5 bg-[#3ecf8e] hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regenerate Key Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Regenerate API Key?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              This will invalidate your current API key. Any integrations using the old key will
              stop working immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateKey}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
