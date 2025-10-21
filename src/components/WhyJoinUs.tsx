import React from 'react';

interface WhyJoinUsProps {
  onClose: () => void;
  onJoinNow: () => void;
}

const WhyJoinUs: React.FC<WhyJoinUsProps> = ({ onClose, onJoinNow }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-2 border-purple-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-200 via-blue-200 to-cyan-200 p-8 border-b-2 border-purple-400 rounded-t-2xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                🪄 Why Join Merlin?
              </h2>
              <p className="text-xl text-gray-700 italic">
                "Where Magic Meets Energy Storage"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-lg hover:bg-white/50"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Hero Message */}
          <div className="text-center bg-gradient-to-br from-purple-100 via-blue-50 to-white p-8 rounded-2xl border-2 border-purple-300">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Transform Your BESS Business with Merlin
            </h3>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Join thousands of energy professionals who are building accurate quotes, 
              discovering products, and growing their business with the most powerful 
              BESS quoting platform in the industry.
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Build Accurate Quotes */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-400">
              <div className="text-5xl mb-4">📊</div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Build Super Accurate Quotes
              </h4>
              <p className="text-gray-700 mb-4">
                Create professional BESS quotes in minutes with our intelligent tools. 
                Our Smart Wizard guides you step-by-step, while advanced calculators 
                ensure precision every time.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Real-time cost calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Industry-standard assumptions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Export to PDF, Word, or CSV</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Save unlimited quotes to your portfolio</span>
                </li>
              </ul>
            </div>

            {/* Customize Your System */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-400">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Customize Energy Resources
              </h4>
              <p className="text-gray-700 mb-4">
                Mix and match energy resources to create the perfect solution. 
                Include solar, wind, generators, or standalone BESS - all with 
                intelligent sizing recommendations.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Hybrid system configurations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>On-grid and off-grid modes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Multiple use case templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Custom vendor pricing</span>
                </li>
              </ul>
            </div>

            {/* Shop for Products */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-400">
              <div className="text-5xl mb-4">🛒</div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Shop the Marketplace
              </h4>
              <p className="text-gray-700 mb-4">
                Access our curated marketplace of vetted BESS products and vendors. 
                Compare prices, request quotes, and submit proposals directly - all 
                in one place.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Verified vendor products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Real-time price requests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Direct proposal submission</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Earn referral commissions</span>
                </li>
              </ul>
              <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-semibold">
                  🎉 Coming Soon! Marketplace launches Q4 2025
                </p>
              </div>
            </div>

            {/* Promote Your Products */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-xl border-2 border-yellow-400">
              <div className="text-5xl mb-4">🎯</div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Promote Your Products
              </h4>
              <p className="text-gray-700 mb-4">
                Are you a vendor or distributor? Showcase your products on your 
                profile and get discovered by thousands of energy professionals 
                actively building projects.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Custom vendor storefronts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Product catalog management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Lead generation & analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Featured placement opportunities</span>
                </li>
              </ul>
              <div className="mt-4 bg-orange-100 border-2 border-orange-400 rounded-lg p-3">
                <p className="text-sm text-orange-800 font-semibold">
                  💼 Vendor Program Beta - Join the waitlist!
                </p>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 p-8 rounded-2xl border-2 border-purple-400">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              🚀 More Than Just a Quote Builder
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="text-4xl mb-2">💾</div>
                <h5 className="font-bold text-gray-800 mb-2">Save & Share</h5>
                <p className="text-gray-700 text-sm">
                  Build your portfolio, share quotes with clients, and collaborate 
                  with your team.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <h5 className="font-bold text-gray-800 mb-2">Market Insights</h5>
                <p className="text-gray-700 text-sm">
                  Access industry pricing trends, equipment specifications, and 
                  competitive intelligence.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🤝</div>
                <h5 className="font-bold text-gray-800 mb-2">Connect & Grow</h5>
                <p className="text-gray-700 text-sm">
                  Network with vendors, discover opportunities, and grow your 
                  business with qualified leads.
                </p>
              </div>
            </div>
          </div>

          {/* Membership Tiers Preview */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Choose Your Plan
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <h4 className="font-bold text-lg text-gray-800 mb-2">Free</h4>
                <p className="text-sm text-gray-600 mb-3">Perfect for getting started</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 5 quotes per month</li>
                  <li>• Basic calculations</li>
                  <li>• PDF export</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-2">Professional</h4>
                <p className="text-sm text-gray-600 mb-3">For serious professionals</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Unlimited quotes</li>
                  <li>• Advanced features</li>
                  <li>• All export formats</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg border-2 border-purple-500">
                <h4 className="font-bold text-lg text-gray-800 mb-2">Enterprise</h4>
                <p className="text-sm text-gray-600 mb-3">For teams & vendors</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Everything in Pro</li>
                  <li>• Vendor storefront</li>
                  <li>• Lead generation</li>
                  <li>• API access</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data & Privacy Note */}
          <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-300">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="text-2xl mr-2">🔒</span>
              Your Data, Your Control
            </h4>
            <p className="text-gray-700 text-sm">
              We take privacy seriously. Your project data is encrypted and never shared 
              without your permission. When you opt in to our marketplace or vendor programs, 
              you choose exactly what information to share. We use aggregated, anonymized 
              data for market research to improve our platform and provide better pricing 
              insights to all users.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-b-2xl border-t-2 border-purple-300 sticky bottom-0">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Experience the Magic?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={onJoinNow}
                className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-2xl border-b-4 border-purple-900 hover:from-purple-400 hover:to-purple-700 transition-colors"
              >
                🪄 Join Now - It's Free!
              </button>
              <button
                onClick={onClose}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold text-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              No credit card required • Free forever plan • Upgrade anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyJoinUs;
