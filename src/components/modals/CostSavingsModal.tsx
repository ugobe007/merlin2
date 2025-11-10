import React from 'react';

interface CostSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSmartWizard: () => void;
}

export default function CostSavingsModal({ isOpen, onClose, onShowSmartWizard }: CostSavingsModalProps) {
  if (!isOpen) return null;

  const handleCalculateClick = () => {
    onClose();
    onShowSmartWizard();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">💰 Reduce Energy Costs</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold"
            >×</button>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            Energy storage systems help you dramatically reduce electricity costs by storing energy when it's cheap and using it when prices are high.
          </p>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-bold text-green-900 mb-2">Peak Shaving</h4>
              <p className="text-gray-700">Store energy during off-peak hours (when electricity is cheap) and discharge during peak hours (when rates are highest). Save 30-50% on peak energy charges.</p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-bold text-green-900 mb-2">Demand Charge Reduction</h4>
              <p className="text-gray-700">Reduce your peak demand by supplementing grid power with battery power. Commercial customers can save thousands per month on demand charges alone.</p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-bold text-green-900 mb-2">Time-of-Use Optimization</h4>
              <p className="text-gray-700">Automatically shift your energy consumption to the lowest-cost periods, maximizing savings without any operational changes.</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-World Savings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">$50,000+</div>
              <p className="text-gray-600">Average annual savings for manufacturing facilities</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">30-50%</div>
              <p className="text-gray-600">Reduction in peak energy charges</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">$0.10-0.25</div>
              <p className="text-gray-600">Savings per kWh with arbitrage</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">4-7 years</div>
              <p className="text-gray-600">Typical payback period</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <p className="text-gray-700"><strong>Example:</strong> A 2 MW / 4 MWh system for a manufacturing facility can save $50,000-$100,000 annually through peak shaving and demand charge reduction alone.</p>
          </div>

          <button 
            onClick={handleCalculateClick}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📊</span>
            Calculate Your Savings with Smart Wizard
          </button>
        </div>
      </div>
    </div>
  );
}