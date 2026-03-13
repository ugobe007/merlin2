/**
 * Widget Demo Page
 *
 * Public showcase page for Merlin Widget
 * - Live embedded calculator example
 * - Code snippet generator
 * - Partner signup form
 * - Feature comparison
 */

import { useState } from "react";
import { Copy, Check, Sparkles, Zap, Shield, Code2 } from "lucide-react";

export default function WidgetDemo() {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [customColor, setCustomColor] = useState("#3ecf8e");
  const [selectedIndustry, setSelectedIndustry] = useState("hotel");
  const [showSignupForm, setShowSignupForm] = useState(false);

  // Code snippet with customization
  const codeSnippet = `<!-- Add this to your website -->
<div id="merlin-widget" data-industry="${selectedIndustry}"></div>
<script src="https://widget.merlin.energy/embed.js"></script>
<script>
  MerlinWidget.init({
    apiKey: 'YOUR_API_KEY_HERE',
    industry: '${selectedIndustry}',
    theme: 'light',
    primaryColor: '${customColor}'
  });
</script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Merlin Widget</h1>
                <p className="text-sm text-gray-500">Embeddable Energy Savings Calculator</p>
              </div>
            </div>
            <button
              onClick={() => setShowSignupForm(true)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Get Your API Key
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Add Battery Savings to Your Site in <span className="text-emerald-500">5 Minutes</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Give your customers instant, NREL-verified quotes for battery storage + solar. No
            development needed. Just copy, paste, and go.
          </p>
        </div>

        {/* Live Demo Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left: Live Widget Preview */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            </div>

            {/* Embedded widget preview placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-4xl mb-4">🏨</div>
                <h4 className="text-lg font-semibold text-gray-900">Hotel Energy Calculator</h4>
                <p className="text-sm text-gray-600">
                  Interactive calculator will appear here once embedded on your site
                </p>

                {/* Mock form preview */}
                <div className="space-y-3 mt-6">
                  <div className="bg-white rounded-lg p-3 text-left border border-gray-200">
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Number of Rooms
                    </label>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-left border border-gray-200">
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Hotel Class
                    </label>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                  <button
                    style={{ backgroundColor: customColor }}
                    className="w-full py-2 text-white font-medium rounded-lg"
                  >
                    Calculate Savings
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Powered by Merlin TrueQuote™</p>
                </div>
              </div>
            </div>

            {/* Customization Controls */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="hotel">Hotel</option>
                  <option value="car-wash">Car Wash</option>
                  <option value="hospital">Hospital</option>
                  <option value="data-center">Data Center</option>
                  <option value="office">Office Building</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Code Snippet */}
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Integration Code</h3>
              </div>
              <button
                onClick={handleCopySnippet}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-gray-950 rounded-lg p-6 overflow-x-auto text-sm">
              <code className="text-gray-300 font-mono whitespace-pre">{codeSnippet}</code>
            </pre>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-semibold text-xs">1</span>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Sign up for free API key</p>
                  <p>Get 100 quotes/month on the free tier</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-semibold text-xs">2</span>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Copy code to your website</p>
                  <p>Works with any HTML page or CMS</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-semibold text-xs">3</span>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Start generating leads</p>
                  <p>Track conversions in your dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Choose Your Plan</h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Free</h4>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-sm text-gray-500">per month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>
                    <strong>100 quotes/month</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>NREL-verified pricing</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>TrueQuote™ attribution</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Email support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="text-gray-400">⚠️</span>
                  <span>"Powered by Merlin" badge required</span>
                </li>
              </ul>

              <button className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium rounded-lg transition-colors">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-xl border-2 border-emerald-400 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                MOST POPULAR
              </div>

              <div className="text-center mb-6 text-white">
                <h4 className="text-xl font-bold mb-2">Pro</h4>
                <div className="text-4xl font-bold mb-2">$99</div>
                <p className="text-sm text-emerald-100">per month</p>
              </div>

              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>
                    <strong>500 quotes/month</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Hide "Powered by" badge</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Custom logo + colors</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>

              <button className="w-full py-3 bg-white hover:bg-gray-100 text-emerald-600 font-bold rounded-lg transition-colors">
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-900 p-8">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h4>
                <div className="text-4xl font-bold text-gray-900 mb-2">$499</div>
                <p className="text-sm text-gray-500">per month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>
                    <strong>Unlimited quotes</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>White-label (no Merlin branding)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>CRM integrations (Salesforce, HubSpot)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>SLA + 24/7 support</span>
                </li>
              </ul>

              <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-12 text-center">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-white mb-4">Trusted by Energy Professionals</h3>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Every quote is verified against NREL ATB 2024, IRA 2022 tax credits, and industry
            benchmarks. This isn't a random number generator—it's bankable analysis.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">{`< 2s`}</div>
              <div className="text-gray-400">Load Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">100%</div>
              <div className="text-gray-400">Source Attribution</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">$300K+</div>
              <div className="text-gray-400">ARR Target Year 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal (simplified placeholder) */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Your API Key</h3>
            <p className="text-gray-600 mb-6">
              Start with 100 free quotes per month. No credit card required.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Acme Solar Installers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSignupForm(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
