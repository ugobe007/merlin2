import React from 'react';

interface Step3Props {
  primaryApplication: string;
  setPrimaryApplication: (application: string) => void;
}

const applicationOptions = [
  { id: 'ev-charging', name: 'EV Charging', icon: '🚗', description: 'Powering electric vehicle charging stations.' },
  { id: 'data-center', name: 'Data Center', icon: '💻', description: 'UPS and backup for data centers.' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', description: 'Peak shaving and power quality for industrial sites.' },
  { id: 'commercial', name: 'Commercial', icon: '🏢', description: 'Demand charge reduction for commercial buildings.' },
  { id: 'utility', name: 'Utility Scale', icon: '🏞️', description: 'Grid services like frequency regulation and capacity.' },
  { id: 'resiliency', name: 'Resiliency', icon: '🛡️', description: 'Backup power for critical infrastructure.' },
];

const Step3_Applications: React.FC<Step3Props> = ({ primaryApplication, setPrimaryApplication }) => {
  return (
    <div className="p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">What's your primary application?</h2>
        <p className="text-gray-700 font-semibold">Select the primary use case for your BESS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applicationOptions.map(({ id, name, icon, description }) => (
          <div
            key={id}
            onClick={() => setPrimaryApplication(id)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              primaryApplication === id
                ? 'bg-purple-200 border-purple-600 shadow-xl scale-105'
                : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center mb-3">
              <span className="text-4xl">{icon}</span>
              <h4 className="ml-4 font-bold text-xl text-gray-900">{name}</h4>
            </div>
            <p className="text-sm text-gray-700">{description}</p>
            {primaryApplication === id && (
              <div className="mt-4 pt-3 border-t-2 border-purple-500">
                <p className="text-sm font-bold text-purple-700">✓ SELECTED</p>
              </div>
            )}
            {primaryApplication !== id && (
              <div className="mt-4 pt-3 border-t border-gray-300">
                <p className="text-sm font-semibold text-gray-500">Click to select</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step3_Applications;