import React from 'react';

interface Step1Props {
  power: number;
  setPower: (power: number) => void;
  gridConnection: string;
  setGridConnection: (connection: string) => void;
  selectedEquipment: string[];
  handleEquipmentToggle: (id: string) => void;
}

const equipmentOptions = [
  { id: 'bess', name: 'BESS (Battery Energy Storage)', icon: '🔋', description: 'Core battery system' },
  { id: 'power-gen', name: 'Power Generation', icon: '⚡️', description: 'Diesel/gas generators' },
  { id: 'solar', name: 'Solar Panels', icon: '☀️', description: 'Photovoltaic systems' },
  { id: 'wind', name: 'Wind Turbines', icon: '💨', description: 'Wind power generation' },
  { id: 'hybrid', name: 'Hybrid System', icon: '🔄', description: 'Combined generation + storage' },
  { id: 'grid', name: 'Grid Connection', icon: '🔌', description: 'Utility grid integration' },
];

const Step1_PowerEquipment: React.FC<Step1Props> = ({
  power,
  setPower,
  gridConnection,
  setGridConnection,
  selectedEquipment,
  handleEquipmentToggle,
}) => {
  return (
    <div className="p-4 text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Power Requirements & Equipment Selection</h2>
        <p className="text-purple-200">Tell us about your power needs and what equipment you require.</p>
      </div>

      {/* Power Requirements */}
      <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 p-6 rounded-xl shadow-md border border-blue-500/30 mb-8">
        <h3 className="text-xl font-semibold text-blue-300 mb-4">Power Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label htmlFor="power-mw" className="block text-sm font-medium text-blue-200 mb-2">
              How much power do you need? (MW)
            </label>
            <input
              type="number"
              id="power-mw"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-blue-200 mb-2">Grid Connection</span>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="grid-connection"
                  value="behind"
                  checked={gridConnection === 'behind'}
                  onChange={(e) => setGridConnection(e.target.value)}
                  className="form-radio h-5 w-5 text-purple-600 bg-gray-800 border-purple-500"
                />
                <span className="ml-2 text-white">Behind the meter</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="grid-connection"
                  value="front"
                  checked={gridConnection === 'front'}
                  onChange={(e) => setGridConnection(e.target.value)}
                  className="form-radio h-5 w-5 text-purple-600 bg-gray-800 border-purple-500"
                />
                <span className="ml-2 text-white">Front of meter</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Selection */}
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-800/40 p-6 rounded-xl shadow-md border border-green-500/30">
        <h3 className="text-xl font-semibold text-green-300 mb-4">Equipment Selection</h3>
        <p className="text-sm text-green-200 mb-4">Select all equipment you need for your project.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentOptions.map(({ id, name, icon, description }) => (
            <div
              key={id}
              onClick={() => handleEquipmentToggle(id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedEquipment.includes(id)
                  ? 'bg-green-600/30 border-green-400 shadow-lg scale-105'
                  : 'bg-gray-800/50 border-gray-600/50 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedEquipment.includes(id)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-0"
                />
                <span className="ml-3 text-2xl">{icon}</span>
                <h4 className="ml-3 font-semibold text-white">{name}</h4>
              </div>
              <p className="text-sm text-gray-300 ml-10">{description}</p>
              <p className={`text-xs font-bold ml-10 mt-1 ${selectedEquipment.includes(id) ? 'text-green-400' : 'text-blue-400'}`}>
                Status: {selectedEquipment.includes(id) ? '✓ SELECTED' : 'NOT SELECTED'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1_PowerEquipment;
