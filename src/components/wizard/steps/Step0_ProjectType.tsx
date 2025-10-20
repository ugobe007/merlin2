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
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
          Welcome to the BESS Configuration Wizard
        </h2>
        <p className="text-gray-300 text-xl">
          Let's start by understanding what type of project you're planning.
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-2xl border border-purple-500/30">
        <h3 className="text-2xl font-bold text-purple-300 mb-6">
          What type of system are you looking for?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pure BESS */}
          <button
            onClick={() => setProjectType('bess')}
            className={`p-8 rounded-xl border-2 transition-all text-left ${
              projectType === 'bess'
                ? 'bg-gradient-to-br from-blue-600/40 to-cyan-600/40 border-blue-400 shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-gray-800/40 border-gray-600 hover:border-blue-500/50 hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-6xl">🔋</span>
                {projectType === 'bess' && (
                  <span className="text-green-400 text-3xl">✓</span>
                )}
              </div>
              <h4 className="text-2xl font-bold text-white">Pure BESS</h4>
              <p className="text-gray-300">
                Battery Energy Storage System only
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
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
                ? 'bg-gradient-to-br from-green-600/40 to-emerald-600/40 border-green-400 shadow-lg shadow-green-500/30 scale-105'
                : 'bg-gray-800/40 border-gray-600 hover:border-green-500/50 hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-6xl">⚡</span>
                {projectType === 'hybrid' && (
                  <span className="text-green-400 text-3xl">✓</span>
                )}
              </div>
              <h4 className="text-2xl font-bold text-white">Hybrid BESS</h4>
              <p className="text-gray-300">
                Battery storage + renewable energy sources
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
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
        <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-500/30 animate-fadeIn">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">💡</span>
            <div className="flex-1">
              <h4 className="font-bold text-blue-300 text-lg mb-3">
                {projectType === 'bess' ? 'Pure BESS System' : 'Hybrid BESS System'}
              </h4>
              {projectType === 'bess' ? (
                <div className="text-gray-300 space-y-2">
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
