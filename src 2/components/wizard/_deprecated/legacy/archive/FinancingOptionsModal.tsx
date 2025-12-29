/**
 * Financing Options Landing Modal
 * 
 * Educational landing page that explains financing options before directing
 * users to external resources or the financing calculator.
 */

import React, { useState } from 'react';
import { X, DollarSign, TrendingDown, Calendar, Calculator, ExternalLink } from 'lucide-react';
import FinancingCalculator from '../FinancingCalculator';

interface FinancingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData?: {
    quoteName: string;
    totalCapEx: number;
    annualSavings: number;
    powerMW: number;
    durationHours: number;
  };
}

const FinancingOptionsModal: React.FC<FinancingOptionsModalProps> = ({
  isOpen,
  onClose,
  projectData
}) => {
  const [showCalculator, setShowCalculator] = useState(false);

  if (!isOpen) return null;

  // Default project data if not provided
  const defaultProjectData = {
    quoteName: 'BESS Project',
    totalCapEx: 5000000,
    annualSavings: 800000,
    powerMW: 2,
    durationHours: 4
  };

  const finalProjectData = projectData || defaultProjectData;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Financing Your BESS Project</h2>
                  <p className="text-purple-100 mt-1">Explore options to fund your energy storage investment</p>
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
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">💡 Why Financing Matters</h3>
              <p className="text-gray-700 leading-relaxed">
                Battery energy storage systems require significant upfront capital, but financing options can make 
                these projects more accessible. The right financing structure can optimize your tax benefits, 
                preserve working capital, and improve project economics.
              </p>
            </div>

            {/* Financing Options Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Commercial Loan */}
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
                <div className="text-4xl mb-3">🏦</div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Commercial Loan</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-2">
                  <p><strong>Best For:</strong> Businesses with strong credit</p>
                  <p><strong>Term:</strong> 7-15 years</p>
                  <p><strong>Down Payment:</strong> 10-25%</p>
                  <p><strong>Pros:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Own the asset immediately</li>
                    <li>Capture all tax credits (ITC)</li>
                    <li>Fixed monthly payments</li>
                  </ul>
                  <p><strong>Cons:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Requires down payment</li>
                    <li>On your balance sheet</li>
                  </ul>
                </div>
              </div>

              {/* Equipment Lease */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg">
                <div className="text-4xl mb-3">📋</div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Equipment Lease</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-2">
                  <p><strong>Best For:</strong> Preserving capital</p>
                  <p><strong>Term:</strong> 5-10 years</p>
                  <p><strong>Down Payment:</strong> 0-10%</p>
                  <p><strong>Pros:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Little to no down payment</li>
                    <li>Off-balance sheet option</li>
                    <li>Flexible end-of-term options</li>
                  </ul>
                  <p><strong>Cons:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Don't own asset initially</li>
                    <li>May have higher total cost</li>
                  </ul>
                </div>
              </div>

              {/* Power Purchase Agreement (PPA) */}
              <div className="bg-white rounded-xl p-6 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Power Purchase Agreement</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-2">
                  <p><strong>Best For:</strong> Zero upfront cost</p>
                  <p><strong>Term:</strong> 10-20 years</p>
                  <p><strong>Down Payment:</strong> $0</p>
                  <p><strong>Pros:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>No capital required</li>
                    <li>Developer handles O&M</li>
                    <li>Predictable energy costs</li>
                  </ul>
                  <p><strong>Cons:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Don't own the system</li>
                    <li>No tax benefits</li>
                    <li>Long-term commitment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tax Incentives */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 mb-8 border-2 border-amber-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🎁 Available Tax Incentives</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Investment Tax Credit (ITC)</h4>
                  <p className="text-gray-700">
                    <strong>30% federal tax credit</strong> for standalone battery storage systems. 
                    The ITC covers equipment and installation costs.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Bonus Depreciation</h4>
                  <p className="text-gray-700">
                    <strong>100% first-year depreciation</strong> (through 2024, then phases down). 
                    Accelerate tax deductions to improve cash flow.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">State & Local Incentives</h4>
                  <p className="text-gray-700">
                    Many states offer additional rebates, grants, and property tax exemptions 
                    for energy storage projects.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Utility Programs</h4>
                  <p className="text-gray-700">
                    Demand response and grid services programs can provide ongoing revenue 
                    to offset financing costs.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Use Our Calculator */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-300">
                <div className="flex items-center gap-3 mb-3">
                  <Calculator className="w-6 h-6 text-purple-600" />
                  <h4 className="font-bold text-lg text-gray-900">Compare Financing Options</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Use our interactive calculator to model loan, lease, and PPA scenarios 
                  based on your specific project parameters.
                </p>
                <button
                  onClick={() => setShowCalculator(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Open Calculator
                </button>
              </div>

              {/* External Resources */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-300">
                <div className="flex items-center gap-3 mb-3">
                  <ExternalLink className="w-6 h-6 text-blue-600" />
                  <h4 className="font-bold text-lg text-gray-900">Connect with Lenders</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  EnergySage partners with specialized lenders who understand energy 
                  storage projects and can provide competitive financing terms.
                </p>
                <a
                  href="https://www.energysage.com/solar/financing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Lenders
                </a>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-3">📚 Additional Resources</h4>
              <div className="space-y-2 text-sm">
                <a 
                  href="https://www.seia.org/initiatives/energy-storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-600 hover:text-purple-700 hover:underline"
                >
                  → SEIA: Energy Storage Financing Guide
                </a>
                <a 
                  href="https://www.energy.gov/eere/solar/homeowners-guide-federal-tax-credit-solar-photovoltaics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-600 hover:text-purple-700 hover:underline"
                >
                  → DOE: Federal Tax Credits for Energy Storage
                </a>
                <a 
                  href="https://www.energysage.com/energy-storage/benefits-of-storage/battery-storage-financing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-600 hover:text-purple-700 hover:underline"
                >
                  → EnergySage: Battery Storage Financing Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Calculator Modal */}
      {showCalculator && (
        <FinancingCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          projectData={finalProjectData}
        />
      )}
    </>
  );
};

export default FinancingOptionsModal;
