import React from 'react';

interface Step4_SolarEVDecisionProps {
  wantsSolar: boolean;
  setWantsSolar: (value: boolean) => void;
  wantsEV: boolean;
  setWantsEV: (value: boolean) => void;
}

/**
 * Step 4: Simple Solar/EV Decision
 * Purpose: Quick YES/NO - do you want solar or EV charging?
 * NO power calculations, NO configuration details yet
 * Just capture intent for Step 5
 */
const Step4_SolarEVDecision: React.FC<Step4_SolarEVDecisionProps> = ({
  wantsSolar,
  setWantsSolar,
  wantsEV,
  setWantsEV,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Additional Features
        </h2>
        <p className="text-lg text-gray-600">
          Would you like to include solar power or EV charging in your system?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Don't worry - we'll help you configure these in the next step
        </p>
      </div>

      {/* Decision Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Solar Power Card */}
        <div className={`rounded-xl p-8 border-4 transition-all ${
          wantsSolar 
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-xl' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">☀️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Solar Power
            </h3>
            <p className="text-gray-600 text-sm">
              Generate clean energy, reduce grid dependence, and lower operating costs
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Reduce electricity bills by 30-50%</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Lower carbon footprint</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Federal tax credits available</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Pairs perfectly with battery storage</span>
            </div>
          </div>

          {/* YES/NO Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setWantsSolar(true)}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                wantsSolar
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {wantsSolar ? '✅ Yes, Include Solar' : 'Yes, Add Solar'}
            </button>
            <button
              onClick={() => setWantsSolar(false)}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                !wantsSolar
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {!wantsSolar ? 'No Solar' : 'No, Skip Solar'}
            </button>
          </div>
        </div>

        {/* EV Charging Card */}
        <div className={`rounded-xl p-8 border-4 transition-all ${
          wantsEV 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-xl' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚗⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              EV Charging
            </h3>
            <p className="text-gray-600 text-sm">
              Add electric vehicle charging stations for employees or customers
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Attract EV-driving customers/employees</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Generate revenue from charging fees</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Support sustainability goals</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Battery can power chargers during peak times</span>
            </div>
          </div>

          {/* YES/NO Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setWantsEV(true)}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                wantsEV
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {wantsEV ? '✅ Yes, Include EV Charging' : 'Yes, Add EV Charging'}
            </button>
            <button
              onClick={() => setWantsEV(false)}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                !wantsEV
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {!wantsEV ? 'No EV Charging' : 'No, Skip EV Charging'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">What happens next?</h4>
            <p className="text-sm text-gray-700">
              In the next step, we'll show you your complete power profile and help you configure 
              {wantsSolar && wantsEV && ' both solar and EV charging'}
              {wantsSolar && !wantsEV && ' solar power'}
              {!wantsSolar && wantsEV && ' EV charging'}
              {!wantsSolar && !wantsEV && ' your system'}
              {' '}to meet your needs. You'll see exactly how much power you need and can make adjustments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4_SolarEVDecision;
