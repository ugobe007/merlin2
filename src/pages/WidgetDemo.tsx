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
import { Copy, Check, Sparkles, Zap, Shield, Code2, Upload, X } from "lucide-react";

export default function WidgetDemo() {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [customColor, setCustomColor] = useState("#3ecf8e");
  const [selectedIndustry, setSelectedIndustry] = useState("hotel");
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
        setLogoUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlSubmit = () => {
    if (logoUrl.trim()) {
      setCompanyLogo(logoUrl);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    setLogoUrl("");
  };

  // Industry icon mapping
  const industryIcons: Record<string, string> = {
    hotel: "🏨",
    "car-wash": "🚗",
    hospital: "🏥",
    "data-center": "🖥️",
    office: "🏢",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header - Supabase style */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3ecf8e] to-[#2ab577] rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#0a0a0a]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Merlin Widget</h1>
                <p className="text-xs text-gray-500">Embeddable Energy Calculator</p>
              </div>
            </div>
            <button
              onClick={() => setShowSignupForm(true)}
              className="px-4 py-2 bg-[#3ecf8e] hover:bg-[#2ab577] text-[#0a0a0a] text-sm font-medium rounded-md transition-all"
            >
              Get API Key
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section - Supabase style */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Add Battery Savings to Your Site in{" "}
            <span className="bg-gradient-to-r from-[#3ecf8e] to-[#2ab577] bg-clip-text text-transparent">
              5 Minutes
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Give your customers instant, NREL-verified quotes. Zero development needed.
          </p>
        </div>

        {/* Live Demo Section - Two columns */}
        <div className="grid lg:grid-cols-2 gap-6 mb-16">
          {/* Live Demo Section - Two columns */}
          <div className="grid lg:grid-cols-2 gap-6 mb-16">
            {/* Left: Live Widget Preview */}
            <div className="bg-[#151515] rounded-lg border border-[#1a1a1a] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#3ecf8e]" />
                  <h3 className="text-sm font-semibold text-white">Live Preview</h3>
                </div>
                <span className="text-xs text-gray-500">Updates in real-time</span>
              </div>

              {/* Widget preview with company logo */}
              <div className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="max-w-sm mx-auto space-y-6">
                  {/* Company Logo or Industry Icon */}
                  <div className="flex justify-center">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt="Company logo"
                        className="h-16 w-16 object-contain rounded"
                      />
                    ) : (
                      <div className="text-5xl">{industryIcons[selectedIndustry]}</div>
                    )}
                  </div>

                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Energy Savings Calculator
                    </h4>
                    <p className="text-sm text-gray-600">
                      Get an instant quote for battery storage + solar
                    </p>
                  </div>

                  {/* Mock form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="h-10 bg-gray-100 rounded-md border border-gray-200"></div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Facility Size
                      </label>
                      <div className="h-10 bg-gray-100 rounded-md border border-gray-200"></div>
                    </div>
                    <button
                      style={{ backgroundColor: customColor }}
                      className="w-full py-3 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                    >
                      Calculate Savings →
                    </button>
                  </div>

                  {/* Attribution badge */}
                  <div className="pt-4 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      Powered by{" "}
                      <span className="font-semibold text-[#3ecf8e]">Merlin TrueQuote™</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Customization Controls */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Brand Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-10 w-16 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-white text-sm font-mono focus:border-[#3ecf8e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Industry</label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-[#3ecf8e] focus:outline-none"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="car-wash">Car Wash</option>
                    <option value="hospital">Hospital</option>
                    <option value="data-center">Data Center</option>
                    <option value="office">Office Building</option>
                  </select>
                </div>

                {/* Logo Upload Section */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Company Logo (Optional)
                  </label>
                  <div className="space-y-2">
                    {!companyLogo ? (
                      <>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-md text-gray-400 text-sm cursor-pointer hover:border-[#3ecf8e] transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-[#2a2a2a]"></div>
                          <span className="text-xs text-gray-500">or</span>
                          <div className="flex-1 h-px bg-[#2a2a2a]"></div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://yourcompany.com/logo.png"
                            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-white text-sm placeholder:text-gray-600 focus:border-[#3ecf8e] focus:outline-none"
                          />
                          <button
                            onClick={handleLogoUrlSubmit}
                            className="px-4 py-2 bg-[#3ecf8e] hover:bg-[#2ab577] text-[#0a0a0a] text-sm font-medium rounded-md transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md">
                        <img
                          src={companyLogo}
                          alt="Company logo"
                          className="h-10 w-10 object-contain rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Logo added</p>
                          <p className="text-xs text-gray-500">Visible in widget preview</p>
                        </div>
                        <button
                          onClick={handleRemoveLogo}
                          className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Code Snippet */}
            <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#3ecf8e]" />
                  <h3 className="text-sm font-semibold text-white">Integration Code</h3>
                </div>
              </div>
              <button
                onClick={handleCopySnippet}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm rounded-md transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-4 h-4 text-[#3ecf8e]" />
                    <span className="text-[#3ecf8e]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#0a0a0a] rounded-md p-4 overflow-x-auto text-xs border border-[#1a1a1a]">
              <code className="text-gray-300 font-mono">{codeSnippet}</code>
            </pre>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#3ecf8e] font-semibold text-xs">1</span>
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium mb-0.5">Get your API key</p>
                  <p className="text-gray-500">100 free quotes/month • No credit card</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#3ecf8e] font-semibold text-xs">2</span>
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium mb-0.5">Paste code on your site</p>
                  <p className="text-gray-500">Works with any HTML/CMS platform</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#3ecf8e] font-semibold text-xs">3</span>
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium mb-0.5">Start capturing leads</p>
                  <p className="text-gray-500">Track conversions in dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing - Supabase style */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-white mb-3">Simple, Transparent Pricing</h3>
            <p className="text-gray-400">Choose the plan that fits your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#2a2a2a] transition-colors">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Free</h4>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-500">Perfect for testing</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    <strong className="text-white">100</strong> quotes/month
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">NREL-verified pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">TrueQuote™ attribution</span>
                </li>
                <li className="flex items-start gap-2 text-gray-500">
                  <span className="text-gray-600">⚠</span>
                  <span>"Powered by Merlin" required</span>
                </li>
              </ul>

              <button className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm font-medium rounded-md transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#151515] border-2 border-[#3ecf8e] rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#3ecf8e] text-[#0a0a0a] text-xs font-bold rounded-full">
                POPULAR
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Pro</h4>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-500">For growing businesses</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    <strong className="text-white">500</strong> quotes/month
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Hide attribution badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Custom logo + colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Analytics dashboard</span>
                </li>
              </ul>

              <button className="w-full py-2.5 bg-[#3ecf8e] hover:bg-[#2ab577] text-[#0a0a0a] text-sm font-bold rounded-md transition-colors">
                Start Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#2a2a2a] transition-colors">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Enterprise</h4>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">$499</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-500">For large organizations</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    <strong className="text-white">Unlimited</strong> quotes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Complete white-label</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">CRM integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Dedicated support</span>
                </li>
              </ul>

              <button className="w-full py-2.5 bg-white hover:bg-gray-100 text-[#0a0a0a] text-sm font-medium rounded-md transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Trust Section - Supabase style */}
        <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-12 text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="w-12 h-12 text-[#3ecf8e] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Bank-Ready Analysis</h3>
            <p className="text-gray-400 mb-8">
              Every quote is verified against NREL ATB 2024, IRA 2022 tax credits, and industry
              benchmarks. Not a random number generator.
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-[#3ecf8e] mb-1">{`< 2s`}</div>
                <div className="text-sm text-gray-500">Load Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#3ecf8e] mb-1">100%</div>
                <div className="text-sm text-gray-500">Source Attribution</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#3ecf8e] mb-1">NREL</div>
                <div className="text-sm text-gray-500">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal - Supabase style */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Get Your API Key</h3>
              <button
                onClick={() => setShowSignupForm(false)}
                className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Start with 100 free quotes per month. No credit card required.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm placeholder:text-gray-600 focus:border-[#3ecf8e] focus:outline-none"
                  placeholder="Acme Solar Installers"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm placeholder:text-gray-600 focus:border-[#3ecf8e] focus:outline-none"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Website</label>
                <input
                  type="url"
                  className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm placeholder:text-gray-600 focus:border-[#3ecf8e] focus:outline-none"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <button className="w-full py-3 bg-[#3ecf8e] hover:bg-[#2ab577] text-[#0a0a0a] font-semibold rounded-md transition-colors">
              Create Free Account
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              By signing up, you agree to our Terms of Service
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
