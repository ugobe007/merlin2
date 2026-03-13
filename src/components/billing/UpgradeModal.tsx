import { useState } from "react";
import { X, Check, Zap, Shield, Sparkles, ArrowRight, Loader } from "lucide-react";
import {
  createCheckoutSession,
  getStripePriceByTier,
  isStripeConfigured,
  demoCheckout,
} from "@/services/stripeService";

interface UpgradeModalProps {
  currentTier: "free" | "pro" | "enterprise";
  partnerId: string;
  partnerEmail: string;
  onClose: () => void;
}

export default function UpgradeModal({
  currentTier,
  partnerId,
  partnerEmail,
  onClose,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"pro" | "enterprise" | null>(null);

  const handleUpgrade = async (tier: "pro" | "enterprise") => {
    setLoading(true);
    setSelectedTier(tier);

    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        // Demo mode
        demoCheckout(tier);
        setLoading(false);
        return;
      }

      const priceConfig = getStripePriceByTier(tier);
      if (!priceConfig) {
        throw new Error("Price configuration not found");
      }

      // Create Stripe Checkout Session
      const { url } = await createCheckoutSession({
        priceId: priceConfig.id,
        partnerId,
        partnerEmail,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to start checkout. Please try again or contact support.");
      setLoading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] max-w-5xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
            <p className="text-gray-400 mt-1">Choose the plan that fits your business</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pro Plan */}
            <div
              className={`relative bg-[#0a0a0a] rounded-xl border-2 p-8 transition-all ${
                currentTier === "pro"
                  ? "border-gray-700 opacity-60"
                  : "border-[#3ecf8e] hover:shadow-lg hover:shadow-[#3ecf8e]/20"
              }`}
            >
              {currentTier === "pro" && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-[#3ecf8e] text-white text-xs font-semibold rounded-full">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#3ecf8e]/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#3ecf8e]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <p className="text-sm text-gray-400">For growing businesses</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-500">500 quotes per month</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "500 quotes per month",
                  'Hide "Powered by Merlin" badge',
                  "Custom branding colors",
                  "Logo customization",
                  "Priority email support",
                  "Usage analytics dashboard",
                  "Export quote data (CSV)",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-5 h-5 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade("pro")}
                disabled={currentTier === "pro" || (loading && selectedTier === "pro")}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  currentTier === "pro"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-[#3ecf8e] hover:bg-emerald-400 text-white"
                }`}
              >
                {loading && selectedTier === "pro" ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === "pro" ? (
                  "Current Plan"
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div
              className={`relative bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border-2 p-8 transition-all ${
                currentTier === "enterprise"
                  ? "border-gray-700 opacity-60"
                  : "border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
              }`}
            >
              {currentTier === "enterprise" && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Current Plan
                </div>
              )}

              {currentTier !== "enterprise" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Enterprise</h3>
                  <p className="text-sm text-gray-400">For scale & white-label</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">$499</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-500">Unlimited quotes</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited quotes per month",
                  "Complete white-label (no branding)",
                  "Custom domain integration",
                  "Advanced customization API",
                  "Dedicated account manager",
                  "99.9% uptime SLA",
                  "Custom integration support",
                  "Priority phone support",
                  "Custom contract terms",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade("enterprise")}
                disabled={
                  currentTier === "enterprise" || (loading && selectedTier === "enterprise")
                }
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  currentTier === "enterprise"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                }`}
              >
                {loading && selectedTier === "enterprise" ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === "enterprise" ? (
                  "Current Plan"
                ) : (
                  <>
                    Upgrade to Enterprise
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3ecf8e]" />
                Secure payments via Stripe
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3ecf8e]" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3ecf8e]" />
                14-day money-back guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
