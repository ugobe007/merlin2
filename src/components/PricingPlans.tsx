import React, { useState, useEffect } from "react";
interface PricingPlansProps {
  onClose: () => void;
  onSignUp?: () => void;
  currentTier?: "starter" | "pro" | "advanced" | "business";
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onClose, onSignUp, currentTier }) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showLearnMore, setShowLearnMore] = useState<string | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLearnMore) {
          setShowLearnMore(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, showLearnMore]);

  const handleSelectPlan = (tier: string) => {
    if (tier === "starter") {
      // Allow free signup
      if (onSignUp) {
        onClose();
        onSignUp();
      }
      return;
    }

    if (tier === "business") {
      window.open("mailto:sales@merlin.energy?subject=Enterprise Inquiry", "_blank");
      return;
    }

    // Prepare for Stripe integration - placeholder for payment processing
    const planDetails = {
      tier,
      billing: billingCycle,
      price: tier === "semi_premium" ? getPrice(29) : getPrice(79),
      features:
        tier === "semi_premium"
          ? ["Advanced Analytics", "Portfolio Management", "Export to Word/PDF"]
          : [
              "Everything in Semi-Premium",
              "Unlimited Projects",
              "Priority Support",
              "Custom Branding",
            ],
    };

    // Store upgrade intention for Stripe integration
    localStorage.setItem("pending_upgrade", JSON.stringify(planDetails));

    alert(
      `🚀 Upgrade to ${tier} Plan\n\nPrice: $${planDetails.price}/${billingCycle}\n\nStripe payment integration coming soon!\nWe'll notify you when checkout is ready.`
    );
  };

  const getPrice = (monthly: number) => {
    if (billingCycle === "annual") {
      return Math.floor(monthly * 10); // 2 months free when paying annually
    }
    return monthly;
  };

  const getSavings = (monthly: number) => {
    return monthly * 2; // 2 months free = 2 months of savings
  };

  const getLearnMoreContent = (tier: string) => {
    const content: Record<
      string,
      { title: string; description: string; highlights: string[]; powerProfile: string }
    > = {
      starter: {
        title: "Starter Plan - Begin Your Energy Journey",
        description:
          "The Starter plan is perfect for exploring BESS technology. As you use the platform, you'll build your Power Profile - unlocking new insights and capabilities.",
        powerProfile: "Levels 1-3: Initiate → Practitioner → Specialist",
        highlights: [
          "Generate up to 3 professional quotes per month",
          "Basic BESS system sizing and recommendations",
          "Simple ROI and payback calculations",
          "PDF export with Merlin branding",
          "Request official quotes from Merlin Energy experts",
          "Build your Power Profile as you explore",
          "No credit card required - free forever",
          "Perfect for learning and small projects",
        ],
      },
      professional: {
        title: "Professional Plan - Unlock Your Full Potential",
        description:
          "Unlock advanced analytics, AI recommendations, and detailed financial modeling. Your Power Profile grows with you, unlocking powerful tools as you become an energy expert.",
        powerProfile:
          "Levels 1-6: Initiate → Practitioner → Specialist → Architect → Strategist → Authority",
        highlights: [
          "Unlimited quote generations",
          "Save and manage up to 25 projects",
          "NPV, IRR, and discounted cash flow analysis",
          "AI-powered system recommendations",
          "Detailed equipment breakdown with alternatives",
          "Financing calculator (Loan, Lease, PPA options)",
          "Clean exports without watermarks",
          "Custom logo on all quotes",
          "Priority email support",
          "Perfect for consultants and developers",
        ],
      },
      enterprise_pro: {
        title: "Enterprise Pro - Complete Platform Mastery",
        description:
          "Unlock all 7 Power Profile levels, market intelligence, team collaboration, and enterprise features. The complete toolkit for energy professionals who need maximum capability.",
        powerProfile:
          "All 7 Levels: Initiate → Practitioner → Specialist → Architect → Strategist → Authority → Luminary",
        highlights: [
          "Everything included in Professional",
          "Unlimited projects with team workspace",
          "All 7 Power Profile levels unlocked",
          "Real-time market intelligence reports",
          "Sensitivity analysis and scenario modeling",
          "Team collaboration (up to 5 members)",
          "Vendor quote management system",
          "White-label branding with custom colors",
          "Priority phone support",
          "Perfect for firms and growing enterprises",
        ],
      },
      business: {
        title: "Business Plan - Enterprise-Grade Solution",
        description:
          "A fully customized, enterprise-grade solution with dedicated support, unlimited users, and API access. Built for organizations that need maximum flexibility and control.",
        powerProfile: "All Features + Dedicated Energy Advisor",
        highlights: [
          "Everything included in Enterprise Pro",
          "Unlimited team members",
          "Custom use case template creation",
          "Dedicated account manager",
          "Comprehensive training & onboarding",
          "Custom integrations with your systems",
          "Full API access for automation",
          "99.9% SLA with priority support",
          "Quarterly business reviews",
          "Custom feature development",
          "Perfect for enterprises and utilities",
        ],
      },
    };
    return content[tier] || content["starter"];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl border border-gray-200 shadow-2xl max-h-[95vh] flex flex-col relative">
        {/* Close Button - Positioned Absolutely */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-full w-12 h-12 flex items-center justify-center text-4xl font-bold transition-all shadow-lg hover:shadow-xl border-2 border-gray-300 hover:border-red-400"
          title="Close (ESC)"
        >
          ×
        </button>

        {/* Header - Fixed at top */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-3xl flex-shrink-0">
          <div className="pr-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600 text-lg">
              Select the perfect plan for your BESS quoting needs
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-6">
            <div className="bg-white rounded-xl p-1 inline-flex border-2 border-gray-200 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === "annual"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annual <span className="text-green-600 text-xs ml-1">Save 17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1">
          {/* Pricing Cards */}
          <div className="p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* STARTER - FREE */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Begin your energy journey - no commitment
                </p>

                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600 ml-2">forever</span>
                  </div>
                </div>

                {/* Power Profile Badge */}
                <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-semibold text-purple-700">
                      Power Profile Levels 1-3
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Build your energy expertise as you use the platform
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPlan("free")}
                  className="w-full py-3 rounded-xl font-bold transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                >
                  Start Free
                </button>

                <button
                  onClick={() => setShowLearnMore("starter")}
                  className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Learn More →
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">3 quotes per month</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Basic system sizing</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Simple ROI & payback estimates</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">PDF export (Merlin branded)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Request official quotes</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">NPV, IRR, DCF analysis</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">AI recommendations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Power Profile Levels 4-7</span>
                </div>
              </div>
            </div>

            {/* PROFESSIONAL - MOST POPULAR */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-400 relative hover:shadow-2xl transition-all mt-6">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase shadow-md">
                  Most Popular
                </span>
              </div>

              <div className="mb-4 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <p className="text-sm text-gray-600 mb-4">
                  For energy consultants and project developers
                </p>

                <div className="mb-2">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${getPrice(49)}</span>
                    <span className="text-gray-600 ml-2">
                      per {billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "monthly" && (
                    <p className="text-xs text-gray-600 mt-1">billed monthly</p>
                  )}
                </div>

                {billingCycle === "annual" && (
                  <div className="mb-2">
                    <span className="text-green-600 font-semibold text-sm">
                      💰 Save ${getSavings(49)} annually
                    </span>
                  </div>
                )}

                {/* Power Profile Badge */}
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-violet-100 rounded-xl border border-purple-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📈</span>
                    <span className="text-sm font-semibold text-purple-700">
                      Power Profile Levels 1-6
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Unlock advanced analytics & AI recommendations
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPlan("professional")}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
                >
                  Select Plan
                </button>

                <button
                  onClick={() => setShowLearnMore("professional")}
                  className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Learn More →
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
                1 user • 25 projects • Unlimited quotes
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700 font-semibold">Unlimited quote generations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">NPV, IRR, ROI & payback calculations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">
                    Full hybrid configurations (Solar + Storage)
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">AI-powered recommendations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Detailed equipment breakdown</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Financing calculator (Loan/Lease/PPA)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Clean exports (no watermark)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Custom logo on quotes</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Priority email support</span>
                </div>
              </div>
            </div>

            {/* ENTERPRISE PRO */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition-all">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Pro</h3>
                <p className="text-sm text-gray-600 mb-4">For teams producing quotes at scale</p>

                <div className="mb-2">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${getPrice(149)}</span>
                    <span className="text-gray-600 ml-2">
                      per {billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "monthly" && (
                    <p className="text-xs text-gray-600 mt-1">billed monthly</p>
                  )}
                </div>

                {billingCycle === "annual" && (
                  <div className="mb-2">
                    <span className="text-green-600 font-semibold text-sm">
                      💰 Save ${getSavings(149)} annually
                    </span>
                  </div>
                )}

                {/* Power Profile Badge - Full Access */}
                <div className="mb-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🌟</span>
                    <span className="text-sm font-semibold text-indigo-700">
                      All 7 Power Profile Levels
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600">
                    Complete platform mastery + market intelligence
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPlan("enterprise_pro")}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                >
                  Select Plan
                </button>

                <button
                  onClick={() => setShowLearnMore("enterprise_pro")}
                  className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Learn More →
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
                Up to 5 users • Unlimited projects
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700 font-semibold">Everything in Professional</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">Sensitivity analysis & scenarios</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">Real-time market intelligence</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">Team collaboration (5 members)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">Vendor quote management</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">White-label branding</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span className="text-gray-700">Priority phone support</span>
                </div>
              </div>
            </div>

            {/* BUSINESS */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Organizations seeking creative scale with maximum coverage
                </p>

                <div className="mb-6 py-4">
                  <div className="text-3xl font-bold text-gray-900">Get a quote</div>
                </div>

                <button
                  onClick={() => handleSelectPlan("business")}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
                >
                  Talk to Sales
                </button>

                <button
                  onClick={() => setShowLearnMore("business")}
                  className="w-full mt-2 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Learn More →
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
                Unlimited users • Business license
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700 font-semibold">Everything in Enterprise Pro</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Unlimited team members</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Custom use case template creation</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Dedicated account manager</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Personalized training & onboarding</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Custom integrations & workflows</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Full API access for automation</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">99.9% SLA with priority support</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Quarterly business reviews</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">Custom feature development</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="p-8 bg-gray-800/30 border-t border-purple-500/20 rounded-b-3xl">
            <p className="text-center text-gray-400 text-sm mb-4">
              Trusted by leading energy professionals worldwide
            </p>
            <div className="flex justify-center items-center space-x-8 text-gray-500">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10k+</div>
                <div className="text-xs">Quotes Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">$2B+</div>
                <div className="text-xs">Projects Quoted</div>
              </div>
            </div>
          </div>
        </div>
        {/* End Scrollable Content */}
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {getLearnMoreContent(showLearnMore).title}
              </h2>
              <button
                onClick={() => setShowLearnMore(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-1 text-3xl leading-none transition-all"
                title="Close (ESC)"
              >
                ×
              </button>
            </div>

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              {getLearnMoreContent(showLearnMore).description}
            </p>

            {/* Power Profile Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-2 flex items-center gap-2">
                <span>⚡</span> Power Profile Access
              </h3>
              <p className="text-purple-700 font-medium">
                {getLearnMoreContent(showLearnMore).powerProfile}
              </p>
              <p className="text-sm text-purple-600 mt-2">
                Your Power Profile grows as you use the platform, unlocking new capabilities and
                insights.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features & Benefits:</h3>
              <div className="space-y-3">
                {getLearnMoreContent(showLearnMore).highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-purple-600 mr-3 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowLearnMore(null);
                  handleSelectPlan(showLearnMore);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
              >
                {showLearnMore === "business" ? "Contact Sales" : "Select This Plan"}
              </button>
              <button
                onClick={() => setShowLearnMore(null)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
