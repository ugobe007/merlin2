import React from 'react';

export default function ElCarWashLanding() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-white">Merlin BESS</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="text-gray-300 hover:text-white transition">Home</a>
              <a href="/wizard-v8" className="text-gray-300 hover:text-white transition">Quote Tool</a>
              <button
                onClick={() => window.open('mailto:sales@merlinbess.com?subject=El%20Car%20Wash%20Partnership', '_blank')}
                className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <span className="text-emerald-400 text-sm font-semibold">🎯 ALPHA PARTNERSHIP OPPORTUNITY</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Transform El Car Wash Into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                America's Most Sustainable Car Wash Chain
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Portfolio-wide solar + battery transformation: $2.1M investment → $180K/year savings → 5.8yr payback across 5 Florida locations
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.open('mailto:sales@merlinbess.com?subject=Schedule%20El%20Car%20Wash%20Demo&body=I%27d%20like%20to%20schedule%20a%20demo%20for%20El%20Car%20Wash.%20Please%20contact%20me%20at%20your%20earliest%20convenience.', '_blank')}
                className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
              >
                📅 Schedule Alpha Site Demo
              </button>
              <a
                href="/wizard-v8?step=3&industry=car_wash"
                className="px-8 py-4 bg-gray-700 text-white text-lg font-semibold rounded-lg hover:bg-gray-600 transition inline-block"
              >
                📊 View Full Quotes
              </a>
            </div>
          </div>

          {/* Portfolio Metrics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">$2.1M</div>
              <div className="text-gray-300">Total Investment</div>
              <div className="text-sm text-gray-500 mt-1">5 Florida Sites</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">$180K</div>
              <div className="text-gray-300">Annual Savings</div>
              <div className="text-sm text-gray-500 mt-1">Year 1</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">5.8yr</div>
              <div className="text-gray-300">Avg Payback</div>
              <div className="text-sm text-gray-500 mt-1">Simple Payback</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">110%</div>
              <div className="text-gray-300">10-Year ROI</div>
              <div className="text-sm text-gray-500 mt-1">Base Case</div>
            </div>
          </div>

          {/* Why El Car Wash Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🎯 Why El Car Wash Is the Perfect Alpha Partner
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-xl font-semibold text-white mb-3">PE-Backed Speed & Scale</h3>
                <p className="text-gray-300">
                  Financial sophistication, fast decisions, 50+ site portfolio for national rollout
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">☀️</div>
                <h3 className="text-xl font-semibold text-white mb-3">Florida Footprint = Max ROI</h3>
                <p className="text-gray-300">
                  Best solar resource (1,700 kWh/kW/yr), high electricity rates, hurricane resilience value
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-white mb-3">Perfect Use Case Fit</h3>
                <p className="text-gray-300">
                  Customer parking = free solar real estate, predictable loads, ideal for carport systems
                </p>
              </div>
            </div>
          </div>

          {/* 5 Florida Sites */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">📍 5 Florida Locations Ready for Transformation</h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { city: 'Miami', peak: '220 kW', investment: '$448K', savings: '$38.5K', payback: '5.8yr', irr: '19.4%' },
                { city: 'Ft. Lauderdale', peak: '190 kW', investment: '$405K', savings: '$33.2K', payback: '6.1yr', irr: '18.7%' },
                { city: 'Tampa', peak: '165 kW', investment: '$368K', savings: '$29.4K', payback: '6.2yr', irr: '18.3%' },
                { city: 'Orlando', peak: '190 kW', investment: '$407K', savings: '$33.8K', payback: '6.0yr', irr: '18.9%' },
                { city: 'Jacksonville', peak: '165 kW', investment: '$365K', savings: '$28.9K', payback: '6.3yr', irr: '18.1%' },
              ].map((site) => (
                <div key={site.city} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-5">
                  <div className="text-lg font-bold text-white mb-3">{site.city}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Peak Load</span>
                      <span className="text-gray-200 font-semibold">{site.peak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment</span>
                      <span className="text-emerald-400 font-semibold">{site.investment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual Savings</span>
                      <span className="text-blue-400 font-semibold">{site.savings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payback</span>
                      <span className="text-purple-400 font-semibold">{site.payback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IRR</span>
                      <span className="text-orange-400 font-semibold">{site.irr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Comparison - Miami Flagship */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">🚀 Scenario Analysis: Miami Flagship</h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { name: 'Solar Only', investment: '$185K', savings: '$17.4K', payback: '10.6yr', roi: '48%', note: 'Lowest cost' },
                { name: 'Solar + BESS', investment: '$448K', savings: '$38.5K', payback: '5.8yr', roi: '116%', note: '✅ Recommended', highlight: true },
                { name: 'Solar + BESS + Backup', investment: '$595K', savings: '$40.2K', payback: '7.4yr', roi: '95%', note: 'Max resilience' },
                { name: 'Solar + BESS + EV', investment: '$496K', savings: '$80.5K', payback: '6.2yr', roi: '162%', note: 'New revenue' },
                { name: 'Complete Package', investment: '$643K', savings: '$82.2K', payback: '7.8yr', roi: '128%', note: 'Flagship showcase' },
              ].map((scenario) => (
                <div
                  key={scenario.name}
                  className={`backdrop-blur border rounded-xl p-5 ${
                    scenario.highlight
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-400 mb-1">{scenario.note}</div>
                  <div className="text-lg font-bold text-white mb-3">{scenario.name}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment</span>
                      <span className="text-emerald-400 font-semibold">{scenario.investment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual</span>
                      <span className="text-blue-400 font-semibold">{scenario.savings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payback</span>
                      <span className="text-purple-400 font-semibold">{scenario.payback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">10yr ROI</span>
                      <span className="text-orange-400 font-semibold">{scenario.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Value Propositions */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">🌟 Unique Value Propositions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '🌞', title: 'Solar Carport = Free Real Estate', desc: 'Use customer parking for solar + provide shade — no roof modifications' },
                { icon: '⚡', title: 'Peak Shaving = $24K-29K/year', desc: 'BESS reduces demand charges during 11am-7pm wash peak hours' },
                { icon: '🏆', title: 'Brand Differentiation', desc: '"Solar-Powered Car Wash" — marketing & PR value + sustainability positioning' },
                { icon: '🌪️', title: 'Hurricane Resilience', desc: '150+ mph wind-rated equipment + instant backup power (<16ms transfer)' },
                { icon: '🔋', title: 'EV Charging Revenue Option', desc: 'Add $42K/year revenue with Level 2 chargers — attract high-income customers' },
                { icon: '📈', title: 'Portfolio-Wide Scalability', desc: 'Standardize → replicate across 50+ sites → $1.8M+ annual savings' },
              ].map((prop) => (
                <div key={prop.title} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                  <div className="text-4xl mb-3">{prop.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{prop.title}</h3>
                  <p className="text-gray-300 text-sm">{prop.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* EPC Partners */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">🔧 Tier 1 EPC Partners (Pre-Vetted)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 backdrop-blur border border-emerald-500/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Advanced Green Technologies</div>
                  <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-semibold">
                    #1 RECOMMENDED
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Florida-based solar carport specialists</li>
                  <li>✅ Engineering + fabrication + installation (turnkey)</li>
                  <li>✅ Hurricane engineering experience</li>
                  <li>✅ Energy storage integration</li>
                  <li>✅ PE-friendly contracting</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Solar Source</div>
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-xs font-semibold">
                    #2 STRONG BACKUP
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Self-performs all work (no subs)</li>
                  <li>✅ Parking lot carports, ground mounts</li>
                  <li>✅ Energy storage experience</li>
                  <li>✅ Fast-track scheduling</li>
                  <li>✅ Florida statewide operations</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Compass Solar Energy</div>
                  <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 text-xs font-semibold">
                    #3 SOLID ALTERNATIVE
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Government + commercial carport track record</li>
                  <li>✅ Strong utility/permitting relationships</li>
                  <li>✅ References: Colleges, municipal sites</li>
                  <li>✅ Conservative execution</li>
                  <li>✅ Florida statewide</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 backdrop-blur border border-emerald-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform El Car Wash?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Schedule an alpha site demo, coordinate EPC site walks, or download the full quote package with 25-year financial models.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.open('mailto:sales@merlinbess.com?subject=El%20Car%20Wash%20Alpha%20Demo%20Request&body=I%27m%20interested%20in%20scheduling%20an%20alpha%20site%20demo%20for%20El%20Car%20Wash.%20Please%20contact%20me%20at%3A%0A%0AName%3A%20%0ATitle%3A%20%0APhone%3A%20%0AEmail%3A%20%0A%0APreferred%20alpha%20site%3A%20%5BMiami%20or%20Orlando%5D%0APreferred%20configuration%3A%20%5BSolar%2BBESS%20or%20Solar%2BBESS%2BEV%5D', '_blank')}
                className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
              >
                📅 Schedule Alpha Site Demo
              </button>
              <button
                onClick={() => window.open('/campaigns/EL_CAR_WASH_FLORIDA_QUOTES.md', '_blank')}
                className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                📊 Download Full Quotes
              </button>
              <button
                onClick={() => window.location.href = '/wizard-v8'}
                className="px-8 py-4 bg-gray-700 text-white text-lg font-semibold rounded-lg hover:bg-gray-600 transition"
              >
                🧮 Try Quote Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p className="mb-4">⚡ Merlin BESS Solutions — Alpha Partnership Program</p>
          <p className="text-sm">
            Campaign: El Car Wash Florida Transformation | March 2026
            <br />
            For inquiries: <a href="mailto:sales@merlinbess.com" className="text-emerald-400 hover:text-emerald-300">sales@merlinbess.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
