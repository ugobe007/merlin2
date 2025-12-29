import React, { useState } from 'react';
import { Calculator, X, Sparkles } from 'lucide-react';

interface AISquareFootageCalculatorProps {
  onCalculate: (squareFootage: number) => void;
  industryType: string;
}

const AISquareFootageCalculator: React.FC<AISquareFootageCalculatorProps> = ({
  onCalculate,
  industryType,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [floors, setFloors] = useState('1');
  const [unusablePercent, setUnusablePercent] = useState('15');
  const [calculatedSqFt, setCalculatedSqFt] = useState<number | null>(null);

  const handleCalculate = () => {
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const floorsNum = parseInt(floors);
    const unusableNum = parseFloat(unusablePercent);

    if (lengthNum > 0 && widthNum > 0 && floorsNum > 0) {
      const totalSqFt = lengthNum * widthNum * floorsNum;
      const usableSqFt = totalSqFt * (1 - unusableNum / 100);
      setCalculatedSqFt(Math.round(usableSqFt));
    }
  };

  const handleApply = () => {
    if (calculatedSqFt) {
      onCalculate(calculatedSqFt);
      setShowModal(false);
      // Reset form
      setLength('');
      setWidth('');
      setFloors('1');
      setUnusablePercent('15');
      setCalculatedSqFt(null);
    }
  };

  const getUnusablePercentGuidance = () => {
    switch (industryType) {
      case 'hotel':
        return 'Hotels: 25-35% (hallways, lobby, back-of-house)';
      case 'office':
        return 'Office: 15-20% (common areas, restrooms)';
      case 'datacenter':
        return 'Data Center: 20-30% (cooling, power equipment)';
      case 'warehouse':
        return 'Warehouse: 5-10% (office, loading docks)';
      case 'retail':
        return 'Retail: 10-15% (storage, employee areas)';
      case 'manufacturing':
        return 'Manufacturing: 15-25% (equipment, maintenance)';
      default:
        return 'Typical: 15-20% (common areas, utilities)';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm"
      >
        <Calculator className="w-4 h-4" />
        <span>AI Calculate</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">AI Square Footage Calculator</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-white/90 text-sm mt-2">
                Let's calculate your usable square footage based on building dimensions
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Building Dimensions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">📐</span>
                  Building Dimensions
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length (feet)
                    </label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="e.g., 200"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (feet)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g., 150"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    value={floors}
                    onChange={(e) => setFloors(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              {/* Unusable Space */}
              <div className="space-y-2 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-800">
                  Unusable Space (%)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  {getUnusablePercentGuidance()}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={unusablePercent}
                    onChange={(e) => setUnusablePercent(e.target.value)}
                    className="flex-1"
                  />
                  <span className="font-semibold text-blue-600 min-w-[3rem] text-right">
                    {unusablePercent}%
                  </span>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={!length || !width || !floors}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Calculate Square Footage
              </button>

              {/* Result */}
              {calculatedSqFt !== null && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Usable Square Footage</div>
                    <div className="text-4xl font-bold text-green-600">
                      {calculatedSqFt.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">sq ft</div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1 pt-3 border-t border-green-200">
                    <div className="flex justify-between">
                      <span>Gross area:</span>
                      <span className="font-medium">
                        {(parseFloat(length) * parseFloat(width) * parseInt(floors)).toLocaleString()} sq ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unusable space ({unusablePercent}%):</span>
                      <span className="font-medium text-red-600">
                        -{((parseFloat(length) * parseFloat(width) * parseInt(floors)) * (parseFloat(unusablePercent) / 100)).toLocaleString()} sq ft
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleApply}
                    className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    ✓ Apply This Value
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISquareFootageCalculator;
