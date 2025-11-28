import React from 'react';

interface Step5_EnhancedApplicationsProps {
  selectedApplications: string[];
  setSelectedApplications: (apps: string[]) => void;
  applicationConfigs: {
    [key: string]: any;
  };
  setApplicationConfigs: (configs: any) => void;
}

const Step5_EnhancedApplications: React.FC<Step5_EnhancedApplicationsProps> = ({
  selectedApplications,
  setSelectedApplications,
  applicationConfigs,
  setApplicationConfigs,
}) => {
  const applications = [
    {
      id: 'ev-charging',
      title: 'EV Charging',
      icon: '🔌',
      description: 'Electric vehicle charging stations',
      color: 'blue',
    },
    {
      id: 'data-center',
      title: 'Data Center',
      icon: '🖥️',
      description: 'Server & IT infrastructure backup',
      color: 'purple',
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      icon: '🏭',
      description: 'Industrial production facilities',
      color: 'orange',
    },
    {
      id: 'industrial-backup',
      title: 'Industrial Backup',
      icon: '🏢',
      description: 'Emergency power for facilities',
      color: 'red',
    },
    {
      id: 'grid-stabilization',
      title: 'Grid Stabilization',
      icon: '⚡',
      description: 'Grid frequency regulation',
      color: 'yellow',
    },
    {
      id: 'renewable-integration',
      title: 'Renewable Integration',
      icon: '🌱',
      description: 'Solar/wind energy storage',
      color: 'green',
    },
    {
      id: 'peak-shaving',
      title: 'Peak Shaving',
      icon: '📉',
      description: 'Reduce peak demand charges',
      color: 'cyan',
    },
    {
      id: 'other',
      title: 'Other',
      icon: '❓',
      description: 'Custom application',
      color: 'gray',
    },
  ];

  const toggleApplication = (appId: string) => {
    if (selectedApplications.includes(appId)) {
      setSelectedApplications(selectedApplications.filter(id => id !== appId));
      // Remove config when deselected
      const newConfigs = { ...applicationConfigs };
      delete newConfigs[appId];
      setApplicationConfigs(newConfigs);
    } else {
      setSelectedApplications([...selectedApplications, appId]);
      // Initialize config
      if (appId === 'ev-charging') {
        setApplicationConfigs({
          ...applicationConfigs,
          [appId]: {
            numChargers: 10,
            chargerType: 'dc-fast',
            voltage: 480,
          },
        });
      } else if (appId === 'data-center') {
        setApplicationConfigs({
          ...applicationConfigs,
          [appId]: {
            serverCapacityKW: 500,
            redundancyLevel: 'n+1',
            upsRequired: true,
          },
        });
      } else if (appId === 'manufacturing') {
        setApplicationConfigs({
          ...applicationConfigs,
          [appId]: {
            loadProfile: 'three-shift',
            peakLoadKW: 2000,
            criticalProcesses: true,
          },
        });
      }
    }
  };

  const updateConfig = (appId: string, field: string, value: any) => {
    setApplicationConfigs({
      ...applicationConfigs,
      [appId]: {
        ...applicationConfigs[appId],
        [field]: value,
      },
    });
  };

  const calculateAdditionalCosts = () => {
    let totalAdditionalCosts = 0;
    
    // EV Charging additional costs
    if (selectedApplications.includes('ev-charging') && applicationConfigs['ev-charging']) {
      const config = applicationConfigs['ev-charging'];
      const chargerCost = config.chargerType === 'dc-fast' ? 50000 : 8000; // DC Fast vs AC Level 2
      const transformerCost = config.voltage === 480 ? 30000 : 15000;
      totalAdditionalCosts += (config.numChargers * chargerCost) + transformerCost;
    }
    
    // Data Center additional costs
    if (selectedApplications.includes('data-center') && applicationConfigs['data-center']) {
      const config = applicationConfigs['data-center'];
      const upsCost = config.upsRequired ? config.serverCapacityKW * 500 : 0;
      const redundancyCost = config.redundancyLevel === 'n+1' ? 100000 : config.redundancyLevel === '2n' ? 250000 : 0;
      totalAdditionalCosts += upsCost + redundancyCost;
    }
    
    // Manufacturing additional costs
    if (selectedApplications.includes('manufacturing') && applicationConfigs['manufacturing']) {
      const config = applicationConfigs['manufacturing'];
      const criticalLoadProtection = config.criticalProcesses ? 150000 : 0;
      const shiftSupport = config.loadProfile === 'three-shift' ? 80000 : config.loadProfile === 'two-shift' ? 50000 : 0;
      totalAdditionalCosts += criticalLoadProtection + shiftSupport;
    }
    
    // Add base costs for other applications (no detailed config required)
    if (selectedApplications.includes('industrial-backup')) {
      totalAdditionalCosts += 200000; // Base backup power equipment
    }
    if (selectedApplications.includes('grid-stabilization')) {
      totalAdditionalCosts += 150000; // Grid connection and control equipment
    }
    if (selectedApplications.includes('renewable-integration')) {
      totalAdditionalCosts += 100000; // Integration and control systems
    }
    if (selectedApplications.includes('peak-shaving')) {
      totalAdditionalCosts += 75000; // Monitoring and control equipment
    }
    if (selectedApplications.includes('other')) {
      totalAdditionalCosts += 50000; // General purpose equipment
    }
    
    return totalAdditionalCosts;
  };

  const getColorClass = (color: string, selected: boolean) => {
    if (selected) {
      const colorMap: { [key: string]: string } = {
        blue: 'from-blue-600/40 to-cyan-600/40 border-blue-400 shadow-blue-500/30',
        purple: 'from-purple-600/40 to-pink-600/40 border-purple-400 shadow-purple-500/30',
        orange: 'from-orange-600/40 to-red-600/40 border-orange-400 shadow-orange-500/30',
        red: 'from-red-600/40 to-pink-600/40 border-red-400 shadow-red-500/30',
        yellow: 'from-yellow-600/40 to-orange-600/40 border-yellow-400 shadow-yellow-500/30',
        green: 'from-green-600/40 to-emerald-600/40 border-green-400 shadow-green-500/30',
        cyan: 'from-cyan-600/40 to-blue-600/40 border-cyan-400 shadow-cyan-500/30',
        gray: 'from-gray-600/40 to-slate-600/40 border-gray-400 shadow-gray-500/30',
      };
      return colorMap[color] || colorMap.gray;
    }
    return 'bg-gray-800/40 border-gray-600 hover:border-purple-500/50';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Primary Applications
        </h2>
        <p className="text-gray-400 text-lg">
          Select all applications that apply to your project
        </p>
      </div>

      {/* Application Selection Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => (
          <button
            key={app.id}
            onClick={() => toggleApplication(app.id)}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              selectedApplications.includes(app.id)
                ? `bg-gradient-to-br ${getColorClass(app.color, true)} shadow-lg`
                : getColorClass(app.color, false) + ' hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{app.icon}</span>
              {selectedApplications.includes(app.id) && (
                <span className="text-green-400 text-2xl">✓</span>
              )}
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{app.title}</h4>
            <p className="text-gray-400 text-sm">{app.description}</p>
          </button>
        ))}
      </div>

      {/* Configuration Panels for Selected Applications */}
      {selectedApplications.includes('ev-charging') && (
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-2xl border border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-300 mb-4">🔌 EV Charging Configuration</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Chargers
              </label>
              <input
                type="number"
                value={applicationConfigs['ev-charging']?.numChargers || 10}
                onChange={(e) => updateConfig('ev-charging', 'numChargers', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Charger Type
              </label>
              <select
                value={applicationConfigs['ev-charging']?.chargerType || 'dc-fast'}
                onChange={(e) => updateConfig('ev-charging', 'chargerType', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ac-level2">AC Level 2 (~$8k/charger)</option>
                <option value="dc-fast">DC Fast Charging (~$50k/charger)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voltage
              </label>
              <select
                value={applicationConfigs['ev-charging']?.voltage || 480}
                onChange={(e) => updateConfig('ev-charging', 'voltage', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="208">208V (Small install)</option>
                <option value="480">480V (Commercial/Industrial)</option>
                <option value="600">600V (High power)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong>Additional Equipment Cost:</strong> $
              {((applicationConfigs['ev-charging']?.numChargers || 10) * 
                (applicationConfigs['ev-charging']?.chargerType === 'dc-fast' ? 50000 : 8000) +
                (applicationConfigs['ev-charging']?.voltage === 480 ? 30000 : 15000)
              ).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Includes chargers, transformers, and distribution equipment
            </p>
          </div>
        </div>
      )}

      {selectedApplications.includes('data-center') && (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-2xl border border-purple-500/30">
          <h3 className="text-xl font-bold text-purple-300 mb-4">🖥️ Data Center Configuration</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Capacity (kW)
              </label>
              <input
                type="number"
                value={applicationConfigs['data-center']?.serverCapacityKW || 500}
                onChange={(e) => updateConfig('data-center', 'serverCapacityKW', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min="100"
                max="10000"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Redundancy Level
              </label>
              <select
                value={applicationConfigs['data-center']?.redundancyLevel || 'n+1'}
                onChange={(e) => updateConfig('data-center', 'redundancyLevel', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="n">N (No redundancy)</option>
                <option value="n+1">N+1 (Single redundancy)</option>
                <option value="2n">2N (Full redundancy)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                UPS Required?
              </label>
              <select
                value={applicationConfigs['data-center']?.upsRequired ? 'yes' : 'no'}
                onChange={(e) => updateConfig('data-center', 'upsRequired', e.target.value === 'yes')}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="yes">Yes (~$500/kW)</option>
                <option value="no">No (BESS only)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-900/30 rounded-lg">
            <p className="text-sm text-purple-200">
              <strong>Additional Equipment Cost:</strong> $
              {(
                (applicationConfigs['data-center']?.upsRequired ? (applicationConfigs['data-center']?.serverCapacityKW || 500) * 500 : 0) +
                (applicationConfigs['data-center']?.redundancyLevel === 'n+1' ? 100000 : 
                 applicationConfigs['data-center']?.redundancyLevel === '2n' ? 250000 : 0)
              ).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Includes UPS systems, redundancy equipment, and cooling
            </p>
          </div>
        </div>
      )}

      {selectedApplications.includes('manufacturing') && (
        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 p-6 rounded-2xl border border-orange-500/30">
          <h3 className="text-xl font-bold text-orange-300 mb-4">🏭 Manufacturing Configuration</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Load Profile
              </label>
              <select
                value={applicationConfigs['manufacturing']?.loadProfile || 'three-shift'}
                onChange={(e) => updateConfig('manufacturing', 'loadProfile', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="single-shift">Single Shift (8hrs)</option>
                <option value="two-shift">Two Shift (16hrs)</option>
                <option value="three-shift">Three Shift (24hrs)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Peak Load (kW)
              </label>
              <input
                type="number"
                value={applicationConfigs['manufacturing']?.peakLoadKW || 2000}
                onChange={(e) => updateConfig('manufacturing', 'peakLoadKW', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                min="500"
                max="20000"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Critical Processes?
              </label>
              <select
                value={applicationConfigs['manufacturing']?.criticalProcesses ? 'yes' : 'no'}
                onChange={(e) => updateConfig('manufacturing', 'criticalProcesses', e.target.value === 'yes')}
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="yes">Yes (Backup required)</option>
                <option value="no">No (Standard)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-orange-900/30 rounded-lg">
            <p className="text-sm text-orange-200">
              <strong>Additional Equipment Cost:</strong> $
              {(
                (applicationConfigs['manufacturing']?.criticalProcesses ? 150000 : 0) +
                (applicationConfigs['manufacturing']?.loadProfile === 'three-shift' ? 80000 :
                 applicationConfigs['manufacturing']?.loadProfile === 'two-shift' ? 50000 : 0)
              ).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Includes critical load protection, shift support systems, and safety equipment
            </p>
          </div>
        </div>
      )}

      {/* Total Additional Costs */}
      {selectedApplications.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-2xl border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-green-300 mb-1">
                💰 Total Application-Specific Costs
              </h3>
              <p className="text-sm text-gray-400">
                Additional equipment needed for your selected applications
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">
                ${calculateAdditionalCosts().toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">
                {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedApplications.length === 0 && (
        <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/30 text-center">
          <p className="text-yellow-300 text-lg">
            ⚠️ Please select at least one application to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default Step5_EnhancedApplications;
