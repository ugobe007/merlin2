import React from 'react';

interface Step2Props {
  budget: number;
  setBudget: (budget: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  warranty: string;
  setWarranty: (warranty: string) => void;
}

const Step2_Budget: React.FC<Step2Props> = ({
  budget,
  setBudget,
  duration,
  setDuration,
  warranty,
  setWarranty,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">Budget & System Requirements</h2>
        <p className="text-gray-700 text-lg font-semibold">Help us understand your budget and system sizing needs.</p>
      </div>

      <div className="space-y-6">
        {/* Budget Selection Cards */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border-2 border-purple-400">
          <label className="block text-xl font-semibold text-purple-800 mb-4">
            What's your approximate budget range?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { value: 100000, label: 'Under $200K', subtitle: 'Micro commercial', isFlexible: false },
              { value: 250000, label: '$200K - $500K', subtitle: 'Small commercial', isFlexible: false },
              { value: 1000000, label: '$500K - $2M', subtitle: 'Medium commercial', isFlexible: false },
              { value: 5000000, label: '$2M - $10M', subtitle: 'Large commercial', isFlexible: false },
              { value: 15000000, label: '$10M+', subtitle: 'Utility scale', isFlexible: false },
              { value: -1, label: 'Flexible', subtitle: 'Show me options', isFlexible: true },
            ].map((option) => {
              const isSelected = option.isFlexible 
                ? budget === -1 
                : Math.abs(budget - option.value) < 100000;
              
              return (
                <div
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600 border-purple-700 shadow-xl scale-105'
                      : 'bg-white border-purple-300 hover:border-purple-500 hover:shadow-md'
                  }`}
                >
                  <h4 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {option.label}
                  </h4>
                  <p className={`text-sm ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                    {option.subtitle}
                  </p>
                  {isSelected && (
                    <p className="text-white font-bold mt-2 text-sm">✓</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* System Size Selection */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-400">
          <label className="block text-xl font-semibold text-blue-800 mb-4">
            What size system category fits your needs?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 1, label: 'Small', subtitle: '< 2MW' },
              { value: 5, label: 'Medium', subtitle: '2-10MW' },
              { value: 15, label: 'Large', subtitle: '> 10MW' },
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => setDuration(option.value)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  duration === option.value
                    ? 'bg-blue-600 border-blue-700 shadow-xl scale-105'
                    : 'bg-white border-blue-300 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <h4 className={`font-bold text-xl mb-1 ${duration === option.value ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </h4>
                <p className={`text-sm ${duration === option.value ? 'text-blue-100' : 'text-gray-600'}`}>
                  {option.subtitle}
                </p>
                {duration === option.value && (
                  <p className="text-white font-bold mt-3 text-lg">✓</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Warranty */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl shadow-lg border-2 border-green-400">
          <label htmlFor="warranty-select" className="block text-xl font-semibold text-green-800 mb-4">
            System Warranty
          </label>
          <select
            id="warranty-select"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-green-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-600 text-lg font-medium text-gray-900 shadow-sm"
          >
            <option value="5">5 Years</option>
            <option value="10">10 Years</option>
            <option value="15">15 Years</option>
            <option value="20">20 Years</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Step2_Budget;