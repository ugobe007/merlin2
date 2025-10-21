import React from 'react';

interface Step0_ProjectTypeProps {
  projectType: string;
  setProjectType: (value: string) => void;
}

const Step0_ProjectType: React.FC<Step0_ProjectTypeProps> = ({
  projectType,
  setProjectType,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">
          Welcome to the BESS Configuration Wizard
        </h2>
        <p className="text-gray-700 text-xl font-semibold">
          Let's start by understanding what type of project you're planning.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border-2 border-blue-400 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          What type of system are you looking for?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pure BESS */}
          <button
            onClick={() => setProjectType('bess')}
            className={`p-8 rounded-xl border-2 transition-all text-left ${
              projectType === 'bess'
                ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-500 shadow-lg shadow-blue-300/50 scale-105'
                : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-6xl">🔋</span>
                {projectType === 'bess' && (
                  <span className="text-green-600 text-3xl">✓</span>
                )}
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Pure BESS</h4>
              <p className="text-gray-700 font-medium">
                Battery Energy Storage System only
              </p>
              <ul className="text-sm text-gray-600 space-y-2 font-medium">
                <li>✓ Grid-connected energy storage</li>
                <li>✓ Peak shaving & demand management</li>
                <li>✓ Backup power capability</li>
                <li>✓ Arbitrage opportunities</li>
              </ul>
            </div>
          </button>

          {/* Hybrid BESS */}
          <button
            onClick={() => setProjectType('hybrid')}
            className={`p-8 rounded-xl border-2 transition-all text-left ${
              projectType === 'hybrid'
                ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-500 shadow-lg shadow-green-300/50 scale-105'
                : 'bg-gray-50 border-gray-300 hover:border-green-400 hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-6xl">⚡</span>
                {projectType === 'hybrid' && (
                  <span className="text-green-600 text-3xl">✓</span>
                )}
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Hybrid BESS</h4>
              <p className="text-gray-700 font-medium">
                Battery storage + renewable energy sources
              </p>
              <ul className="text-sm text-gray-600 space-y-2 font-medium">
                <li>✓ BESS + Solar panels</li>
                <li>✓ BESS + Wind turbines</li>
                <li>✓ BESS + Backup generators</li>
                <li>✓ Complete energy independence</li>
              </ul>
            </div>
          </button>
        </div>
      </div>

      {/* Information based on selection */}
      {projectType && (
        <div className="bg-blue-100 p-6 rounded-xl border-2 border-blue-400 animate-fadeIn shadow-lg">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">💡</span>
            <div className="flex-1">
              <h4 className="font-bold text-blue-800 text-lg mb-3">
                {projectType === 'bess' ? 'Pure BESS System' : 'Hybrid BESS System'}
              </h4>
              {projectType === 'bess' ? (
                <div className="text-gray-700 space-y-2 font-medium">
                  <p>
                    A pure BESS system focuses on battery storage connected to the grid or your facility. 
                    It's ideal for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Reducing peak demand charges</li>
                    <li>Providing backup power during outages</li>
                    <li>Taking advantage of time-of-use rates</li>
                    <li>Grid stabilization and frequency regulation</li>
                  </ul>
                  <p className="mt-3 text-sm text-blue-200">
                    We'll help you size the battery system and calculate ROI based on your local utility rates.
                  </p>
                </div>
              ) : (
                <div className="text-gray-300 space-y-2">
                  <p>
                    A hybrid BESS combines battery storage with renewable energy generation and/or backup power. 
                    It's perfect for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maximizing renewable energy utilization</li>
                    <li>Achieving energy independence</li>
                    <li>Reducing grid reliance and utility bills</li>
                    <li>Meeting sustainability goals</li>
                  </ul>
                  <p className="mt-3 text-sm text-green-200">
                    We'll analyze solar/wind potential, calculate space requirements, and include fuel costs for generators.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step0_ProjectType;
