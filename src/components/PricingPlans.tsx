import React, { useState, useEffect } from 'react';

interface PricingPlansProps {
  onClose: () => void;
  onSignUp?: () => void;
  currentTier?: 'free' | 'professional' | 'enterprise_pro' | 'business';
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onClose, onSignUp, currentTier }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSelectPlan = (tier: string) => {
    if (tier === 'free') {
      // Allow free signup
      if (onSignUp) {
        onClose();
        onSignUp();
      }
      return;
    }
    
    if (tier === 'business') {
      window.open('mailto:sales@merlin.energy?subject=Enterprise Inquiry', '_blank');
      return;
    }

    // TODO: Integrate with Stripe for payment processing
    alert(`🚀 Coming Soon!\n\nUpgrading to ${tier} tier.\n\nStripe integration will be added in the next phase.`);
  };

  const getPrice = (monthly: number) => {
    if (billingCycle === 'annual') {
      return Math.floor(monthly * 10); // 2 months free when paying annually
    }
    return monthly;
  };

  const getSavings = (monthly: number) => {
    return monthly * 2; // 2 months free = 2 months of savings
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-7xl border border-gray-200 shadow-2xl my-8">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 text-lg">Select the perfect plan for your BESS quoting needs</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-1 text-3xl leading-none transition-all"
              title="Close (ESC)"
            >
              ×
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-6">
            <div className="bg-white rounded-xl p-1 inline-flex border-2 border-gray-200 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual <span className="text-green-600 text-xs ml-1">Save 17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* STARTER - FREE */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-sm text-gray-600 mb-4">For new creators getting started with BESS quotes</p>
              
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-2">forever</span>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan('free')}
                className="w-full py-3 rounded-xl font-bold transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-md"
              >
                Start Free
              </button>
              
              <button
                onClick={() => window.open('https://docs.merlin.energy/plans/starter', '_blank')}
                className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Learn More →
              </button>
            </div>

                        <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">3 quote generations per month</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Basic BESS calculator</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">2 standard use case templates</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Word & Excel export</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Email support</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-400 line-through">Save & load projects</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-400 line-through">Advanced analytics</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-400 line-through">Custom branding</span>
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
              <p className="text-sm text-gray-600 mb-4">For energy consultants and project developers</p>
              
              <div className="mb-2">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">${getPrice(49)}</span>
                  <span className="text-gray-600 ml-2">per {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'monthly' && (
                  <p className="text-xs text-gray-600 mt-1">billed monthly</p>
                )}
              </div>

              {billingCycle === 'annual' && (
                <div className="mb-4">
                  <span className="text-green-600 font-semibold text-sm">
                    💰 Save ${getSavings(49)} annually
                  </span>
                </div>
              )}

              <button
                onClick={() => handleSelectPlan('professional')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
              >
                Select Plan
              </button>
              
              <button
                onClick={() => window.open('https://docs.merlin.energy/plans/professional', '_blank')}
                className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Learn More →
              </button>
            </div>

            <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
              1 user • Individual license
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700 font-semibold">Unlimited quote generations</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Save up to 25 projects</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Full hybrid configurations (Solar + Storage)</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">🪄 Smart Wizard AI guidance</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Advanced analytics dashboard</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">NPV, IRR, ROI & payback calculations</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Financing calculator (Loan/Lease/PPA)</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Custom logo on quotes</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">All 8 standard use case templates</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Portfolio management tools</span>
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
              <p className="text-sm text-gray-600 mb-4">For professionals who produce at scale</p>
              
              <div className="mb-2">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">${getPrice(149)}</span>
                  <span className="text-gray-600 ml-2">per {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'monthly' && (
                  <p className="text-xs text-gray-600 mt-1">billed monthly</p>
                )}
              </div>

              {billingCycle === 'annual' && (
                <div className="mb-4">
                  <span className="text-green-600 font-semibold text-sm">
                    💰 Save ${getSavings(149)} annually
                  </span>
                </div>
              )}

              <button
                onClick={() => handleSelectPlan('enterprise_pro')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Select Plan
              </button>
              
              <button
                onClick={() => window.open('https://docs.merlin.energy/plans/enterprise-pro', '_blank')}
                className="w-full mt-2 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Learn More →
              </button>
            </div>

            <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
              Up to 5 users • Team license
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700 font-semibold">Everything in Professional</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Unlimited saved projects</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">All premium use case templates</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Multi-user collaboration (up to 5 team members)</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Vendor quote management system</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Sensitivity analysis & scenario modeling</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">White-label branding (custom colors & logos)</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Priority support with phone access</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span className="text-gray-700">Advanced export options (PDF, DOCX, XLSX)</span>
              </div>
            </div>
          </div>

          {/* BUSINESS */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <p className="text-sm text-gray-600 mb-4">Organizations seeking creative scale with maximum coverage</p>
              
              <div className="mb-6 py-4">
                <div className="text-3xl font-bold text-gray-900">Get a quote</div>
              </div>

              <button
                onClick={() => handleSelectPlan('business')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Talk to Sales
              </button>
              
              <button
                onClick={() => window.open('https://docs.merlin.energy/plans/business', '_blank')}
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
        <div className="p-8 bg-gray-800/30 border-t border-purple-500/20">
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
    </div>
  );
};

export default PricingPlans;
