/**
 * Incentives Guide Landing Modal
 * 
 * Educational landing page that explains available tax credits, rebates,
 * and incentives before directing users to DSIRE database.
 */

import React from 'react';
import { X, Gift, TrendingUp, DollarSign, ExternalLink, MapPin } from 'lucide-react';

interface IncentivesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
  projectSize?: number; // MW
}

const IncentivesGuideModal: React.FC<IncentivesGuideModalProps> = ({
  isOpen,
  onClose,
  location = 'your state',
  projectSize = 2
}) => {
  if (!isOpen) return null;

  // Calculate example ITC value (30% of typical $1M/MW cost)
  const exampleITC = (projectSize * 1000000 * 0.30).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Gift className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Incentives & Tax Credits</h2>
                <p className="text-orange-100 mt-1">Maximize savings with federal, state & local programs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Overview */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 mb-8 border-2 border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">💰 Substantial Financial Support Available</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Battery energy storage projects can qualify for significant federal tax credits, accelerated depreciation, 
              and state/local incentives that can reduce your net project cost by 40-50% or more.
            </p>
            <div className="bg-white rounded-xl p-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">Example for your {projectSize.toFixed(1)} MW project:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Federal ITC (30%):</span>
                  <span className="font-bold text-green-600 ml-2">${exampleITC}</span>
                </div>
                <div>
                  <span className="text-gray-600">Plus State/Local:</span>
                  <span className="font-bold text-green-600 ml-2">Varies by location</span>
                </div>
              </div>
            </div>
          </div>

          {/* Federal Incentives */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🇺🇸 Federal Incentives (Nationwide)
            </h3>
            
            <div className="space-y-4">
              {/* ITC */}
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Investment Tax Credit (ITC)</h4>
                    <div className="text-2xl font-bold text-green-600 mt-1">30% Tax Credit</div>
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Available Now
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Eligible Projects:</strong> Standalone battery storage systems (as of 2023 Inflation Reduction Act)</p>
                  <p><strong>Coverage:</strong> Equipment and installation costs</p>
                  <p><strong>Duration:</strong> 30% through 2032, then steps down to 26% (2033), 22% (2034)</p>
                  <p><strong>How to Claim:</strong> File IRS Form 3468 with your tax return</p>
                  <p className="text-xs text-gray-600 italic mt-3">
                    💡 Tip: The ITC can offset your federal tax liability. If the credit exceeds your tax liability, 
                    you can carry forward the unused portion.
                  </p>
                </div>
              </div>

              {/* Bonus Depreciation */}
              <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Bonus Depreciation</h4>
                    <div className="text-2xl font-bold text-purple-600 mt-1">80% First Year (2024)</div>
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Phase Down
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>What It Is:</strong> Accelerated depreciation for business assets</p>
                  <p><strong>Schedule:</strong> 80% (2024), 60% (2025), 40% (2026), 20% (2027)</p>
                  <p><strong>Benefit:</strong> Reduces taxable income in the year of installation</p>
                  <p><strong>Alternative:</strong> Can use MACRS 5-year depreciation schedule instead</p>
                  <p className="text-xs text-gray-600 italic mt-3">
                    💡 Tip: Bonus depreciation stacks with ITC. Consult your tax advisor to optimize timing.
                  </p>
                </div>
              </div>

              {/* REAP Grants */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">USDA REAP Grants</h4>
                    <div className="text-2xl font-bold text-green-600 mt-1">Up to 50% Grant</div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Rural Areas
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Eligible:</strong> Agricultural producers and rural small businesses</p>
                  <p><strong>Grant Amount:</strong> 25-50% of project costs</p>
                  <p><strong>Maximum:</strong> Varies by project, typically $1M+</p>
                  <p><strong>Application:</strong> Annual deadlines, competitive process</p>
                  <p className="text-xs text-gray-600 italic mt-3">
                    💡 Tip: Can combine REAP grants with ITC, but grant reduces depreciable basis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* State & Local Incentives */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏛️ State & Local Incentives
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* California Example */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-3xl mb-2">🌴</div>
                <h4 className="font-bold text-lg text-gray-900 mb-3">California (SGIP)</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Program:</strong> Self-Generation Incentive Program</p>
                  <p><strong>Incentive:</strong> $200-$1,000 per kWh</p>
                  <p><strong>Bonus:</strong> Higher rates for equity/resilience projects</p>
                  <p><strong>Status:</strong> Limited funding, first-come first-served</p>
                </div>
              </div>

              {/* New York Example */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-3xl mb-2">🗽</div>
                <h4 className="font-bold text-lg text-gray-900 mb-3">New York (VDER)</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Program:</strong> Value of Distributed Energy Resources</p>
                  <p><strong>Incentive:</strong> Performance-based payments</p>
                  <p><strong>Benefit:</strong> $0.05-$0.15/kWh discharged</p>
                  <p><strong>Status:</strong> Ongoing, automatic enrollment</p>
                </div>
              </div>

              {/* Massachusetts Example */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="text-3xl mb-2">🦅</div>
                <h4 className="font-bold text-lg text-gray-900 mb-3">Massachusetts (SMART)</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Program:</strong> Solar Massachusetts Renewable Target</p>
                  <p><strong>Incentive:</strong> $0.10-$0.40/kWh storage adder</p>
                  <p><strong>Benefit:</strong> 10-year payment guarantee</p>
                  <p><strong>Status:</strong> Active, block-based pricing</p>
                </div>
              </div>

              {/* Texas Example */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="text-3xl mb-2">🤠</div>
                <h4 className="font-bold text-lg text-gray-900 mb-3">Texas (Property Tax)</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Program:</strong> Property Tax Exemption</p>
                  <p><strong>Incentive:</strong> 100% property tax exemption</p>
                  <p><strong>Benefit:</strong> Permanent savings on property tax</p>
                  <p><strong>Status:</strong> Automatic for qualifying systems</p>
                </div>
              </div>
            </div>
          </div>

          {/* Utility Programs */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 mb-8 border-2 border-indigo-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">⚡ Utility Demand Response Programs</h3>
            <p className="text-gray-700 text-sm mb-4">
              Many utilities offer demand response or capacity payment programs that provide ongoing revenue:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Capacity Payments</h5>
                <p className="text-gray-600">$50-$150/kW-year for providing grid reliability</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Energy Arbitrage</h5>
                <p className="text-gray-600">Profit from peak/off-peak price differentials</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Frequency Regulation</h5>
                <p className="text-gray-600">$200-$500/MW-hour for fast response</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Demand Charges</h5>
                <p className="text-gray-600">Reduce $10-$25/kW peak demand fees</p>
              </div>
            </div>
          </div>

          {/* How to Apply */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 How to Apply for Incentives</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <p className="font-semibold">Research Available Programs</p>
                  <p className="text-gray-600">Use DSIRE database to find all applicable incentives in your area</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <p className="font-semibold">Check Eligibility Requirements</p>
                  <p className="text-gray-600">System size, location, use case, and ownership structure</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <p className="font-semibold">Consult Tax/Financial Advisor</p>
                  <p className="text-gray-600">Optimize incentive stacking and tax strategy</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <p className="font-semibold">Apply Before Installation</p>
                  <p className="text-gray-600">Some programs require pre-approval or reservation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">5</div>
                <div>
                  <p className="font-semibold">Document Everything</p>
                  <p className="text-gray-600">Keep receipts, invoices, and system specifications for tax filing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">Find Incentives in {location}</h3>
            <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
              The DSIRE database (Database of State Incentives for Renewables & Efficiency) is the most 
              comprehensive source for incentive information, maintained by NC State University.
            </p>
            <a
              href="https://www.dsireusa.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-orange-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-all shadow-lg"
            >
              <MapPin className="w-6 h-6" />
              Search DSIRE Database
              <ExternalLink className="w-5 h-5" />
            </a>
            <p className="text-xs text-orange-100 mt-4">
              You'll be redirected to DSIRE - the official database for energy incentives
            </p>
          </div>

          {/* Additional Resources */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-3">📚 Additional Resources</h4>
            <div className="space-y-2 text-sm">
              <a 
                href="https://www.energy.gov/eere/solar/federal-solar-tax-credits-businesses"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                → DOE: Federal Tax Credits for Energy Storage
              </a>
              <a 
                href="https://www.irs.gov/forms-pubs/about-form-3468"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                → IRS Form 3468: Investment Credit
              </a>
              <a 
                href="https://www.seia.org/research-resources/inflation-reduction-act-energy-storage"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                → SEIA: Inflation Reduction Act Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncentivesGuideModal;
