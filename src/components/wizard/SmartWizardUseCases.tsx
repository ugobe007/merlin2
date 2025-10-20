import React from 'react';

export interface UseCase {
  id: string;
  name: string;
  icon: string;
  description: string;
  suggestedConfig: {
    powerMW: string;
    energyMWh: string;
    voltage: string;
    applications: string[];
    keyFeatures: string[];
    estimatedCost: string;
  };
}

const useCases: UseCase[] = [
  {
    id: 'ev-charging',
    name: 'EV Charging Station',
    icon: '🔌',
    description: 'Fast charging infrastructure for electric vehicles',
    suggestedConfig: {
      powerMW: '2-5',
      energyMWh: '4-10',
      voltage: '480V',
      applications: ['DC Fast Charging', 'Level 2 Charging', 'Grid Support'],
      keyFeatures: ['Peak Shaving', 'Load Balancing', 'Renewable Integration'],
      estimatedCost: '$800K - $2M'
    }
  },
  {
    id: 'solar-storage',
    name: 'Solar + Storage',
    icon: '☀️',
    description: 'Solar PV with battery energy storage system',
    suggestedConfig: {
      powerMW: '3-10',
      energyMWh: '6-20',
      voltage: '480V',
      applications: ['Solar Smoothing', 'Peak Shaving', 'Grid Services'],
      keyFeatures: ['Time Shifting', 'Frequency Regulation', 'Backup Power'],
      estimatedCost: '$1.2M - $4M'
    }
  }
];

interface SmartWizardUseCasesProps {
  onUseCaseSelect: (useCase: UseCase) => void;
  selectedUseCase: UseCase | null;
}

const SmartWizardUseCases: React.FC<SmartWizardUseCasesProps> = ({
  onUseCaseSelect,
  selectedUseCase
}) => {

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Select Your Use Case</h2>
        <p className="text-gray-600">Choose a preconfigured solution to get started quickly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {useCases.map((useCase) => (
          <div
            key={useCase.id}
            className={`p-6 rounded-lg transition-all duration-300 cursor-pointer ${
              selectedUseCase?.id === useCase.id
                ? 'bg-blue-600 text-white shadow-2xl transform -translate-y-2'
                : 'bg-white hover:bg-gray-50 hover:shadow-xl'
            }`}
            onClick={() => onUseCaseSelect(useCase)}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{useCase.icon}</div>
              <h3 className="text-lg font-semibold">{useCase.name}</h3>
              <p className="text-sm">{useCase.description}</p>
            </div>

            {selectedUseCase?.id === useCase.id && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartWizardUseCases;
