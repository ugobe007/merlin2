import React from 'react';

interface UseCaseTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: UseCaseTemplate) => void;
}

export interface UseCaseTemplate {
  name: string;
  icon: string;
  description: string;
  configuration: {
    powerMW: number;
    durationHours: number;
    gridMode: string;
    generatorMW: number;
    solarMW: number;
    windMW: number;
    utilization: number;
    warranty: string;
  };
  benefits: string[];
  typicalApplications: string[];
  estimatedPayback: string;
}

const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
  {
    name: 'EV Charging Station',
    icon: '🚗',
    description: 'Optimized for fast-charging electric vehicle infrastructure with peak demand management',
    configuration: {
      powerMW: 2.5,
      durationHours: 2,
      gridMode: 'Hybrid',
      generatorMW: 0.5,
      solarMW: 0, // Optional - add if space permits
      windMW: 0,
      utilization: 0.65,
      warranty: '10 years',
    },
    benefits: [
      'Reduces peak demand charges during rush hours',
      'Provides backup power for charging stations',
      'Enables lower electricity rates with solar integration',
      'Supports fast-charging without grid upgrades',
    ],
    typicalApplications: [
      'Highway rest stops',
      'Shopping center charging hubs',
      'Fleet charging depots',
      'Urban fast-charging stations',
    ],
    estimatedPayback: '5-7 years',
  },
  {
    name: 'Data Center Backup',
    icon: '💾',
    description: 'High-reliability power with extended runtime for mission-critical operations',
    configuration: {
      powerMW: 5,
      durationHours: 4,
      gridMode: 'On-grid',
      generatorMW: 2,
      solarMW: 0, // Optional - add if space permits
      windMW: 0,
      utilization: 0.45,
      warranty: '15 years',
    },
    benefits: [
      'Eliminates diesel generator dependency',
      'Provides clean, instant backup power',
      'Reduces cooling costs with smart dispatch',
      'Enables participation in demand response programs',
    ],
    typicalApplications: [
      'Tier 3 & Tier 4 data centers',
      'Cloud computing facilities',
      'Colocation centers',
      'Edge computing sites',
    ],
    estimatedPayback: '6-9 years',
  },
  {
    name: 'Manufacturing Peak Shaving',
    icon: '🏭',
    description: 'Demand charge reduction for industrial facilities with high power requirements',
    configuration: {
      powerMW: 10,
      durationHours: 3,
      gridMode: 'On-grid',
      generatorMW: 0,
      solarMW: 0, // Optional - add if space permits
      windMW: 0,
      utilization: 0.55,
      warranty: '10 years',
    },
    benefits: [
      'Drastically reduces monthly demand charges',
      'Smooths production load profiles',
      'Integrates with renewable energy',
      'Provides power quality improvements',
    ],
    typicalApplications: [
      'Automotive manufacturing',
      'Heavy machinery plants',
      'Food processing facilities',
      'Chemical production',
    ],
    estimatedPayback: '4-6 years',
  },
  {
    name: 'Commercial Building Optimization',
    icon: '🏢',
    description: 'Energy cost reduction and sustainability for office buildings and retail',
    configuration: {
      powerMW: 1.5,
      durationHours: 4,
      gridMode: 'Hybrid',
      generatorMW: 0.25,
      solarMW: 0, // Optional - add if roof space permits
      windMW: 0,
      utilization: 0.40,
      warranty: '10 years',
    },
    benefits: [
      'Lowers electricity bills through time-shifting',
      'Achieves green building certifications',
      'Provides emergency backup power',
      'Maximizes solar self-consumption',
    ],
    typicalApplications: [
      'Office towers',
      'Shopping malls',
      'Hotels and resorts',
      'Mixed-use developments',
    ],
    estimatedPayback: '7-10 years',
  },
  {
    name: 'Utility-Scale Grid Services',
    icon: '⚡',
    description: 'Large-scale storage for frequency regulation, capacity markets, and arbitrage',
    configuration: {
      powerMW: 50,
      durationHours: 4,
      gridMode: 'On-grid',
      generatorMW: 0,
      solarMW: 0, // Optional - utility-scale solar typically off-site
      windMW: 0, // Optional - typically off-site wind farm
      utilization: 0.75,
      warranty: '20 years',
    },
    benefits: [
      'Generates revenue from multiple value streams',
      'Provides grid stabilization services',
      'Enables renewable energy integration',
      'Participates in capacity and ancillary markets',
    ],
    typicalApplications: [
      'Wholesale energy arbitrage',
      'Frequency regulation',
      'Renewable energy firming',
      'Transmission deferral',
    ],
    estimatedPayback: '5-8 years',
  },
  {
    name: 'Remote Microgrid',
    icon: '🏝️',
    description: 'Off-grid or islanded power systems for remote locations and communities',
    configuration: {
      powerMW: 3,
      durationHours: 6,
      gridMode: 'Off-grid',
      generatorMW: 2,
      solarMW: 0, // Optional - recommended for off-grid if space permits
      windMW: 0, // Optional - add if wind resource available
      utilization: 0.50,
      warranty: '15 years',
    },
    benefits: [
      'Eliminates diesel fuel costs and logistics',
      'Provides 24/7 reliable power',
      'Reduces carbon emissions significantly',
      'Enables renewable energy integration',
    ],
    typicalApplications: [
      'Island communities',
      'Mining operations',
      'Military bases',
      'Remote villages',
    ],
    estimatedPayback: '4-7 years',
  },
  {
    name: 'Agricultural Operations',
    icon: '🚜',
    description: 'Energy cost reduction for farms with irrigation, cold storage, and processing',
    configuration: {
      powerMW: 1,
      durationHours: 6,
      gridMode: 'Hybrid',
      generatorMW: 0.5,
      solarMW: 0, // Optional - farms often have good space for solar
      windMW: 0, // Optional - add if wind resource available
      utilization: 0.35,
      warranty: '10 years',
    },
    benefits: [
      'Reduces peak demand during irrigation',
      'Powers cold storage facilities efficiently',
      'Provides backup for critical operations',
      'Maximizes farm solar generation value',
    ],
    typicalApplications: [
      'Irrigation systems',
      'Cold storage warehouses',
      'Dairy operations',
      'Processing facilities',
    ],
    estimatedPayback: '6-9 years',
  },
  {
    name: 'Hospital & Healthcare',
    icon: '🏥',
    description: 'Critical power infrastructure with highest reliability standards',
    configuration: {
      powerMW: 4,
      durationHours: 8,
      gridMode: 'On-grid',
      generatorMW: 3,
      solarMW: 0, // Optional - add if roof space available
      windMW: 0,
      utilization: 0.60,
      warranty: '15 years',
    },
    benefits: [
      'Provides instantaneous backup power',
      'Reduces reliance on diesel generators',
      'Lowers energy costs without compromising reliability',
      'Supports sustainability initiatives',
    ],
    typicalApplications: [
      'Acute care hospitals',
      'Surgical centers',
      'Medical campuses',
      'Long-term care facilities',
    ],
    estimatedPayback: '8-12 years',
  },
];

const UseCaseTemplates: React.FC<UseCaseTemplatesProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-400">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span>🎯</span>
                Use Case Templates
              </h2>
              <p className="text-purple-100 mt-1">Pre-configured BESS solutions for common applications</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg px-4 py-2 transition-all text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASE_TEMPLATES.map((template) => (
              <div
                key={template.name}
                className="bg-white rounded-xl border-2 border-gray-300 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Template Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-5xl">{template.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{template.name}</h3>
                      <p className="text-sm text-blue-100 mt-1">Est. Payback: {template.estimatedPayback}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mt-3">{template.description}</p>
                </div>

                {/* Configuration Summary */}
                <div className="p-6 bg-gray-50 border-b-2 border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>⚙️</span>
                    System Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power:</span>
                      <span className="font-semibold text-blue-700">{template.configuration.powerMW} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-blue-700">{template.configuration.durationHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold text-purple-700">
                        {(template.configuration.powerMW * template.configuration.durationHours).toFixed(1)} MWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mode:</span>
                      <span className="font-semibold text-green-700">{template.configuration.gridMode}</span>
                    </div>
                    {template.configuration.solarMW > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Solar:</span>
                        <span className="font-semibold text-yellow-600">{template.configuration.solarMW} MW</span>
                      </div>
                    )}
                    {template.configuration.windMW > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wind:</span>
                        <span className="font-semibold text-cyan-600">{template.configuration.windMW} MW</span>
                      </div>
                    )}
                    {template.configuration.generatorMW > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generator:</span>
                        <span className="font-semibold text-orange-600">{template.configuration.generatorMW} MW</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="p-6 border-b-2 border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>✅</span>
                    Key Benefits
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {template.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Typical Applications */}
                <div className="p-6 border-b-2 border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📍</span>
                    Typical Applications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {template.typicalApplications.map((app, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="p-6">
                  <button
                    onClick={() => {
                      onApplyTemplate(template);
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    <span>Apply This Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Template Info */}
          <div className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-xl border-2 border-yellow-400">
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>💡</span>
              Need a Custom Configuration?
            </h3>
            <p className="text-gray-700">
              These templates are starting points based on industry best practices. Apply any template and customize 
              to match your specific requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseTemplates;
export { USE_CASE_TEMPLATES };
