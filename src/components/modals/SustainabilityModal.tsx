import React from 'react';

interface SustainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSmartWizard: () => void;
}

export default function SustainabilityModal({ isOpen, onClose, onShowSmartWizard }: SustainabilityModalProps) {
  if (!isOpen) return null;

  const handleCalculateClick = () => {
    onClose();
    onShowSmartWizard();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">🌱 Achieve Sustainability</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold"
            >×</button>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            Energy storage is essential for achieving net-zero goals, maximizing renewable energy use, and qualifying for valuable tax incentives.
          </p>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Environmental Benefits</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-bold text-emerald-900 mb-2">Maximize Renewable Energy</h4>
              <p className="text-gray-700">Store excess solar and wind energy for use when the sun isn't shining or wind isn't blowing. Increase renewable usage from 30% to 80%+.</p>
            </div>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-bold text-emerald-900 mb-2">Reduce Carbon Footprint</h4>
              <p className="text-gray-700">Offset fossil fuel consumption by using stored clean energy. A 2 MW / 4 MWh system can eliminate 500+ tons of CO₂ annually.</p>
            </div>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-bold text-emerald-900 mb-2">Enable Grid Decarbonization</h4>
              <p className="text-gray-700">Help integrate more renewable energy onto the grid by providing essential grid services and reducing curtailment.</p>
            </div>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-bold text-emerald-900 mb-2">Energy Independence</h4>
              <p className="text-gray-700">Combined with solar, achieve near-complete energy independence. Protect against outages while reducing grid reliance.</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Financial Incentives</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
              <h4 className="font-bold text-green-900 mb-2 text-xl">30% Federal Investment Tax Credit (ITC)</h4>
              <p className="text-gray-700 mb-2">Reduces your system cost by 30% when paired with solar. A $1M system becomes $700K after the credit.</p>
              <p className="text-sm text-gray-600">Available through 2032, then phases down to 26% (2033), 22% (2034)</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">Accelerated Depreciation (MACRS)</h4>
              <p className="text-gray-700">Depreciate 85% of system value over 5 years. Additional $150K-300K in tax savings for typical commercial systems.</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">State & Local Incentives</h4>
              <p className="text-gray-700">Many states offer additional rebates, grants, and incentives. California's SGIP program offers up to $200/kWh.</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Corporate Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 mb-2">✓ ESG Reporting</div>
              <p className="text-gray-600">Demonstrate environmental commitment to stakeholders</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Brand Value</div>
              <p className="text-gray-600">Enhance reputation with sustainability leadership</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Future-Proof</div>
              <p className="text-gray-600">Prepare for carbon pricing and regulations</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Certifications</div>
              <p className="text-gray-600">Qualify for LEED, ENERGY STAR, and more</p>
            </div>
          </div>

          <button 
            onClick={handleCalculateClick}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎯</span>
            Calculate Your Environmental Impact
          </button>
        </div>
      </div>
    </div>
  );
}