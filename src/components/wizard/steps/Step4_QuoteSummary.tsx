import React, { useState } from 'react';
import ConsultationModal from '../../modals/ConsultationModal';

interface Step4_QuoteSummaryProps {
  // System configuration
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  location: string;
  selectedGoal: string | string[];
  industryTemplate: string | string[];
  
  // Quote calculations (will be passed from parent)
  equipmentCost: number;
  installationCost: number;
  shippingCost: number;
  tariffCost: number;
  totalProjectCost: number;
  annualSavings: number;
  paybackYears: number;
  taxCredit30Percent: number;
  netCostAfterTaxCredit: number;
}

const Step4_QuoteSummary: React.FC<Step4_QuoteSummaryProps> = ({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW,
  location,
  selectedGoal,
  industryTemplate,
  equipmentCost,
  installationCost,
  shippingCost,
  tariffCost,
  totalProjectCost,
  annualSavings,
  paybackYears,
  taxCredit30Percent,
  netCostAfterTaxCredit,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const totalEnergyMWh = storageSizeMW * durationHours;
  const hasRenewables = solarMW > 0 || windMW > 0 || generatorMW > 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const installationOptions = [
    {
      id: 'epc',
      icon: '🏗️',
      name: 'Full Turnkey (EPC)',
      description: 'One vendor handles everything',
      markup: '25-35%',
      cost: installationCost * 1.3,
      recommended: true,
      pros: ['Lowest hassle', 'Single point of contact', 'Warranty coverage', 'Fastest deployment'],
      cons: ['Highest cost', 'Less control']
    },
    {
      id: 'contractor',
      icon: '👷',
      name: 'General Contractor',
      description: 'You hire the contractor',
      markup: '15-25%',
      cost: installationCost * 1.2,
      recommended: false,
      pros: ['Medium cost', 'More control', 'Can negotiate rates'],
      cons: ['You manage coordination', 'More effort required']
    },
    {
      id: 'self',
      icon: '🔧',
      name: 'Self-Installation',
      description: 'You manage everything',
      markup: '0%',
      cost: installationCost,
      recommended: false,
      pros: ['Lowest cost', 'Full control', 'Equipment only'],
      cons: ['Highest complexity', 'Requires expertise', 'You handle permits']
    }
  ];

  const shippingOptions = [
    {
      id: 'best-value',
      icon: '⭐',
      name: 'Best Value (Recommended)',
      description: 'Optimized shipping route',
      cost: shippingCost,
      leadTime: '8-12 weeks',
      recommended: true
    },
    {
      id: 'usa',
      icon: '🇺🇸',
      name: 'USA Supplier',
      description: 'Fastest delivery, higher cost',
      cost: shippingCost * 1.4,
      leadTime: '4-6 weeks',
      recommended: false
    },
    {
      id: 'china',
      icon: '🇨🇳',
      name: 'China Direct',
      description: 'Best price, longer lead time, 21% tariff',
      cost: shippingCost * 0.8,
      leadTime: '12-16 weeks',
      recommended: false
    }
  ];

  const financingOptions = [
    {
      id: 'cash',
      icon: '💰',
      name: 'Cash Purchase',
      upfront: totalProjectCost,
      monthly: 0,
      ownership: true,
      taxCredits: true,
      cost10yr: totalProjectCost - (annualSavings * 10),
      recommended: true
    },
    {
      id: 'loan',
      icon: '🏦',
      name: 'Traditional Loan (5yr)',
      upfront: totalProjectCost * 0.2,
      monthly: (totalProjectCost * 0.8 * 1.06) / 60, // 6% interest
      ownership: true,
      taxCredits: true,
      cost10yr: totalProjectCost * 1.1 - (annualSavings * 10),
      recommended: false
    },
    {
      id: 'lease',
      icon: '📋',
      name: 'Lease / PPA',
      upfront: 0,
      monthly: annualSavings * 0.8 / 12, // Provider takes 20% of savings
      ownership: false,
      taxCredits: false,
      cost10yr: (annualSavings * 0.8 * 10),
      recommended: false
    }
  ];

  const selectedInstallationOption = installationOptions.find(o => o.id === selectedInstallation);
  const selectedShippingOption = shippingOptions.find(o => o.id === selectedShipping);
  const selectedFinancingOption = financingOptions.find(o => o.id === selectedFinancing);

  // Recalculate totals based on selections
  const adjustedTotalCost = equipmentCost + (selectedInstallationOption?.cost || installationCost) + (selectedShippingOption?.cost || shippingCost) + tariffCost;
  const adjustedNetCost = adjustedTotalCost - taxCredit30Percent;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">
          Your Custom Quote
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Review your system configuration and choose your options
        </p>
      </div>

      {/* System Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-400 p-8 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Your Energy Storage System
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left: System Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Power Output:</span>
              <span className="text-2xl font-bold text-blue-600">{storageSizeMW.toFixed(1)} MW</span>
            </div>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Total Storage:</span>
              <span className="text-2xl font-bold text-green-600">{totalEnergyMWh.toFixed(1)} MWh</span>
            </div>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Duration:</span>
              <span className="text-2xl font-bold text-purple-600">{durationHours} hours</span>
            </div>
            {hasRenewables && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <div className="text-sm font-semibold text-green-900 mb-2">+ Renewables:</div>
                {solarMW > 0 && <div className="text-sm">☀️ Solar: {solarMW.toFixed(1)} MW</div>}
                {windMW > 0 && <div className="text-sm">💨 Wind: {windMW.toFixed(1)} MW</div>}
                {generatorMW > 0 && <div className="text-sm">⚡ Generator: {generatorMW.toFixed(1)} MW</div>}
              </div>
            )}
          </div>

          {/* Right: Financial Summary */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 mb-1">Equipment & Installation</div>
              <div className="text-2xl font-bold text-gray-800">${(adjustedTotalCost / 1000000).toFixed(2)}M</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow border border-green-300">
              <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
              <div className="text-2xl font-bold text-green-600">${(annualSavings / 1000).toFixed(0)}K/year</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Payback Period</div>
              <div className="text-2xl font-bold text-blue-600">{paybackYears.toFixed(1)} years</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-300">
              <div className="text-sm text-gray-600 mb-1">30% Federal Tax Credit</div>
              <div className="text-2xl font-bold text-purple-600">-${(taxCredit30Percent / 1000000).toFixed(2)}M</div>
            </div>
          </div>
        </div>

        {/* Bottom: Net Cost */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl text-center">
          <div className="text-sm opacity-90 mb-1">Net Project Cost (After Tax Credit)</div>
          <div className="text-4xl font-bold">${(adjustedNetCost / 1000000).toFixed(2)}M</div>
        </div>
      </div>

      {/* Expandable Options Sections */}
      <div className="space-y-4">
        
        {/* Installation Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('installation')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏗️</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Installation Options</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedInstallationOption?.name} (+${((selectedInstallationOption?.cost || 0) / 1000000).toFixed(2)}M)
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'installation' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'installation' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                {installationOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedInstallation(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedInstallation === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Recommended
                        </span>
                      )}
                      {selectedInstallation === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <div className="text-lg font-bold text-blue-600 mb-2">
                      ${(option.cost / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Markup: {option.markup}</div>
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-gray-700">Pros:</div>
                      {option.pros.map((pro, idx) => (
                        <div key={idx} className="text-green-600">✓ {pro}</div>
                      ))}
                      <div className="font-semibold text-gray-700 mt-2">Cons:</div>
                      {option.cons.map((con, idx) => (
                        <div key={idx} className="text-red-600">✗ {con}</div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Logistics Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('shipping')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚚</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Shipping & Logistics</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedShippingOption?.name} (+${((selectedShippingOption?.cost || 0) / 1000).toFixed(0)}K)
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'shipping' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'shipping' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedShipping(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedShipping === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Recommended
                        </span>
                      )}
                      {selectedShipping === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-xs text-gray-600 mb-3">{option.description}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-bold text-blue-600">${(option.cost / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lead Time:</span>
                        <span className="font-semibold text-gray-700">{option.leadTime}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="text-sm text-gray-700">
                    <strong>Tariffs:</strong> 21% tariff on batteries from China = +${(tariffCost / 1000).toFixed(0)}K (already included in total)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financing Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('financing')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">💳</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Financing Options</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedFinancingOption?.name}
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'financing' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'financing' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {financingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFinancing(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedFinancing === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Best ROI
                        </span>
                      )}
                      {selectedFinancing === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3">{option.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upfront:</span>
                        <span className="font-bold">${(option.upfront / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className="font-bold">${(option.monthly / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">You Own It:</span>
                        <span className="font-semibold">{option.ownership ? '✅' : '❌'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Credits:</span>
                        <span className="font-semibold">{option.taxCredits ? '✅' : '❌'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-600">10yr Net:</span>
                        <span className="font-bold text-green-600">
                          ${(option.cost10yr / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Option</th>
                      <th className="p-3 text-right">Upfront</th>
                      <th className="p-3 text-right">Monthly</th>
                      <th className="p-3 text-center">Ownership</th>
                      <th className="p-3 text-right">10yr Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financingOptions.map((option) => (
                      <tr key={option.id} className={selectedFinancing === option.id ? 'bg-blue-50 font-semibold' : ''}>
                        <td className="p-3">{option.name}</td>
                        <td className="p-3 text-right">${(option.upfront / 1000000).toFixed(2)}M</td>
                        <td className="p-3 text-right">${(option.monthly / 1000).toFixed(1)}K</td>
                        <td className="p-3 text-center">{option.ownership ? '✅' : '❌'}</td>
                        <td className="p-3 text-right text-green-600 font-bold">${(option.cost10yr / 1000000).toFixed(2)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Help Box */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Need Help Deciding?</h4>
            <p className="text-gray-700 mb-3">
              Our energy consultants can help you choose the right options for your project and connect you with trusted partners.
            </p>
            <button 
              onClick={() => setShowConsultationModal(true)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Schedule Free Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        quoteData={{
          capacity: totalEnergyMWh,
          power: storageSizeMW,
          duration: durationHours,
          solar: solarMW,
          wind: windMW,
          generator: generatorMW,
          location,
          goal: selectedGoal,
          industry: industryTemplate,
          totalCost: totalProjectCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing,
          annualSavings,
          paybackYears
        }}
      />
    </div>
  );
};

export default Step4_QuoteSummary;
