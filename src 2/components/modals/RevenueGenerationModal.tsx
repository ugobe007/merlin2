import React from 'react';

interface RevenueGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSmartWizard: () => void;
}

export default function RevenueGenerationModal({ isOpen, onClose, onShowSmartWizard }: RevenueGenerationModalProps) {
  if (!isOpen) return null;

  const handleModelClick = () => {
    onClose();
    onShowSmartWizard();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">📈 Generate Revenue</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold"
            >×</button>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            Transform your energy storage system from a cost-saving tool into an active revenue generator by participating in grid services and energy markets.
          </p>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Revenue Streams</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-900 mb-2">Frequency Regulation</h4>
              <p className="text-gray-700">Get paid to help stabilize the electric grid by providing fast-response power. Earn $10-50/kW-year depending on your market.</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-900 mb-2">Demand Response Programs</h4>
              <p className="text-gray-700">Utilities pay you to reduce consumption during peak events. Typical payments: $50-200/kW-year.</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-900 mb-2">Energy Arbitrage</h4>
              <p className="text-gray-700">Buy low, sell high. Charge when electricity is cheap, discharge when prices spike. Can generate $20-100/kWh-year.</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-900 mb-2">Capacity Markets</h4>
              <p className="text-gray-700">Get paid simply for having capacity available when the grid needs it. Steady income stream of $30-150/kW-year.</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Revenue Potential</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">$100K-300K</div>
              <p className="text-gray-600">Annual revenue for 5 MW system in ERCOT</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">3-5 years</div>
              <p className="text-gray-600">Typical ROI with stacked revenue</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">15-25%</div>
              <p className="text-gray-600">IRR for well-optimized systems</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">Multiple</div>
              <p className="text-gray-600">Stack 3-5 revenue streams simultaneously</p>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
            <p className="text-gray-700"><strong>Best Markets:</strong> ERCOT (Texas), CAISO (California), PJM (Mid-Atlantic), and ISO-NE (New England) offer the most lucrative opportunities for battery storage revenue.</p>
          </div>

          <button 
            onClick={handleModelClick}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">💹</span>
            Model Your Revenue with Smart Wizard
          </button>
        </div>
      </div>
    </div>
  );
}