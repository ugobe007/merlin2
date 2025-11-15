import React from 'react';

interface Step1_IndustryTemplateProps {
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  useTemplate: boolean;
  setUseTemplate: (value: boolean) => void;
  onOpenAdvancedQuoteBuilder?: () => void;
}

const Step1_IndustryTemplate: React.FC<Step1_IndustryTemplateProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  useTemplate,
  setUseTemplate,
  onOpenAdvancedQuoteBuilder,
}) => {
  
  const templates = [
    {
      id: 'manufacturing',
      icon: '🏭',
      name: 'Manufacturing Facility',
      description: 'High power demand with predictable schedules (NREL validated)',
      typical: '2-5 MW / 4-6 hours',
      savings: '$75K-200K/year',
      color: 'blue'
    },
    {
      id: 'office',
      icon: '🏢',
      name: 'Office Building',
      description: 'Commercial real estate with steady daytime load (CBECS data)',
      typical: '500 kW - 2 MW / 2-4 hours',
      savings: '$25K-75K/year',
      color: 'cyan'
    },
    {
      id: 'datacenter',
      icon: '💻',
      name: 'Data Center',
      description: '24/7 operations requiring backup power (Uptime Institute)',
      typical: '5-20 MW / 4-8 hours',
      savings: '$200K-1M/year',
      color: 'purple'
    },
    {
      id: 'warehouse',
      icon: '📦',
      name: 'Warehouse/Distribution',
      description: 'Logistics facilities with peak demand (DOE validated)',
      typical: '1-3 MW / 2-4 hours',
      savings: '$40K-100K/year',
      color: 'orange'
    },
    {
      id: 'hotel',
      icon: '🏨',
      name: 'Hotel/Hospitality',
      description: 'Guest services with morning/evening peaks',
      typical: '500 kW - 1.5 MW / 3-4 hours',
      savings: '$30K-80K/year',
      color: 'pink'
    },
    {
      id: 'retail',
      icon: '🛒',
      name: 'Retail Store',
      description: 'Shopping centers with HVAC loads',
      typical: '200 kW - 1 MW / 2-4 hours',
      savings: '$15K-50K/year',
      color: 'green'
    },
    {
      id: 'agriculture',
      icon: '🚜',
      name: 'Farm/Agriculture',
      description: 'Irrigation and processing operations',
      typical: '500 kW - 3 MW / 4-6 hours',
      savings: '$25K-100K/year',
      color: 'emerald'
    },
    {
      id: 'car-wash',
      icon: '🚗',
      name: 'Car Wash',
      description: 'High dryer loads during peak hours',
      typical: '250 kW - 500 kW / 2-3 hours',
      savings: '$40K-80K/year',
      color: 'cyan'
    },
    {
      id: 'ev-charging',
      icon: '⚡',
      name: 'EV Charging Hub',
      description: 'Fast chargers with demand management',
      typical: '500 kW - 2 MW / 1-2 hours',
      savings: '$50K-150K/year',
      color: 'blue'
    },
    {
      id: 'apartment',
      icon: '🏘️',
      name: 'Apartment Building',
      description: 'Multi-tenant with EV charging & amenities',
      typical: '500 kW - 1.5 MW / 3-4 hours',
      savings: '$35K-90K/year',
      color: 'pink'
    },
    {
      id: 'college',
      icon: '🎓',
      name: 'University/College',
      description: 'Campus-wide energy management',
      typical: '3-10 MW / 4-6 hours',
      savings: '$150K-500K/year',
      color: 'purple'
    },
    {
      id: 'indoor-farm',
      icon: '🌱',
      name: 'Indoor Farm',
      description: '24/7 LED grow lights & climate control',
      typical: '400 kW - 1 MW / 4-6 hours',
      savings: '$60K-150K/year',
      color: 'emerald'
    },
    {
      id: 'tribal-casino',
      icon: '🎰',
      name: 'Tribal Casino',
      description: '24/7 gaming, hospitality & entertainment',
      typical: '2-8 MW / 4-8 hours',
      savings: '$120K-400K/year',
      color: 'yellow'
    },
    {
      id: 'logistics-center',
      icon: '🚚',
      name: 'Logistics Center',
      description: 'Amazon, FedEx, UPS distribution hubs',
      typical: '1-5 MW / 3-6 hours',
      savings: '$80K-250K/year',
      color: 'orange'
    },
    {
      id: 'shopping-center',
      icon: '🏬',
      name: 'Shopping Center/Mall',
      description: 'Multi-tenant retail with HVAC & lighting',
      typical: '1-4 MW / 4-6 hours',
      savings: '$70K-200K/year',
      color: 'pink'
    },
    {
      id: 'gas-station',
      icon: '⛽',
      name: 'Gas Station/C-Store',
      description: 'Convenience store with pumps & refrigeration',
      typical: '150 kW - 400 kW / 2-3 hours',
      savings: '$25K-60K/year',
      color: 'blue'
    },
    {
      id: 'government',
      icon: '🏛️',
      name: 'City/Government Building',
      description: 'Municipal facilities requiring resilience',
      typical: '1-3 MW / 4-8 hours',
      savings: '$50K-150K/year',
      color: 'indigo'
    },
    {
      id: 'custom',
      icon: '⚙️',
      name: 'Custom Configuration',
      description: 'Build from scratch for unique needs',
      typical: 'You decide',
      savings: 'We\'ll calculate',
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: { [key: string]: { bg: string; border: string; shadow: string } } = {
      blue: {
        bg: isSelected ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-white',
        border: isSelected ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400',
        shadow: isSelected ? 'shadow-lg shadow-blue-300/50' : 'hover:shadow-md'
      },
      cyan: {
        bg: isSelected ? 'bg-gradient-to-br from-cyan-100 to-blue-100' : 'bg-white',
        border: isSelected ? 'border-cyan-500' : 'border-gray-300 hover:border-cyan-400',
        shadow: isSelected ? 'shadow-lg shadow-cyan-300/50' : 'hover:shadow-md'
      },
      purple: {
        bg: isSelected ? 'bg-gradient-to-br from-purple-100 to-violet-100' : 'bg-white',
        border: isSelected ? 'border-purple-500' : 'border-gray-300 hover:border-purple-400',
        shadow: isSelected ? 'shadow-lg shadow-purple-300/50' : 'hover:shadow-md'
      },
      orange: {
        bg: isSelected ? 'bg-gradient-to-br from-orange-100 to-amber-100' : 'bg-white',
        border: isSelected ? 'border-orange-500' : 'border-gray-300 hover:border-orange-400',
        shadow: isSelected ? 'shadow-lg shadow-orange-300/50' : 'hover:shadow-md'
      },
      pink: {
        bg: isSelected ? 'bg-gradient-to-br from-pink-100 to-rose-100' : 'bg-white',
        border: isSelected ? 'border-pink-500' : 'border-gray-300 hover:border-pink-400',
        shadow: isSelected ? 'shadow-lg shadow-pink-300/50' : 'hover:shadow-md'
      },
      green: {
        bg: isSelected ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-white',
        border: isSelected ? 'border-green-500' : 'border-gray-300 hover:border-green-400',
        shadow: isSelected ? 'shadow-lg shadow-green-300/50' : 'hover:shadow-md'
      },
      emerald: {
        bg: isSelected ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-white',
        border: isSelected ? 'border-emerald-500' : 'border-gray-300 hover:border-emerald-400',
        shadow: isSelected ? 'shadow-lg shadow-emerald-300/50' : 'hover:shadow-md'
      },
      yellow: {
        bg: isSelected ? 'bg-gradient-to-br from-yellow-100 to-amber-100' : 'bg-white',
        border: isSelected ? 'border-yellow-500' : 'border-gray-300 hover:border-yellow-400',
        shadow: isSelected ? 'shadow-lg shadow-yellow-300/50' : 'hover:shadow-md'
      },
      indigo: {
        bg: isSelected ? 'bg-gradient-to-br from-indigo-100 to-blue-100' : 'bg-white',
        border: isSelected ? 'border-indigo-500' : 'border-gray-300 hover:border-indigo-400',
        shadow: isSelected ? 'shadow-lg shadow-indigo-300/50' : 'hover:shadow-md'
      },
      gray: {
        bg: isSelected ? 'bg-gradient-to-br from-gray-100 to-slate-100' : 'bg-white',
        border: isSelected ? 'border-gray-600' : 'border-gray-300 hover:border-gray-500',
        shadow: isSelected ? 'shadow-lg shadow-gray-300/50' : 'hover:shadow-md'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold text-gray-800">
          Quick Configuration
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Start with an industry template or build your own custom configuration
        </p>
      </div>

      {/* Path Selection - Moved to top for better UX */}
      <div className="bg-white rounded-xl border-2 border-blue-400 p-5 shadow-lg">
        {useTemplate ? (
          <>
            <p className="text-center text-gray-600 mb-4 text-lg">
              Choose an industry to get started with pre-configured values
            </p>
            
            {/* SCROLLABLE AREA - Increased height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 mb-4">
              {templates.map((template) => {
                const isSelected = selectedTemplate === template.id;
                const colorClasses = getColorClasses(template.color, isSelected);
                
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      console.log('🎯 Template clicked:', template.id);
                      console.log('🎯 onOpenAdvancedQuoteBuilder exists?', !!onOpenAdvancedQuoteBuilder);
                      if (template.id === 'custom' && onOpenAdvancedQuoteBuilder) {
                        // Redirect to Advanced Quote Builder for custom configuration
                        console.log('🚀 Calling onOpenAdvancedQuoteBuilder()');
                        onOpenAdvancedQuoteBuilder();
                      } else {
                        setSelectedTemplate(template.id);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${colorClasses.bg} ${colorClasses.border} ${colorClasses.shadow} hover:scale-105`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-4xl">{template.icon}</span>
                        {isSelected && (
                          <span className="text-green-600 text-2xl">✓</span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-600">
                        {template.description}
                      </p>
                      <div className="text-xs space-y-1 pt-2 border-t border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Typical:</span>
                          <span className="font-semibold text-gray-700">{template.typical}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Savings:</span>
                          <span className="font-semibold text-green-600">{template.savings}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Action Buttons - Moved below template grid */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setUseTemplate(true)}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
              >
                ⚡ Start from Template (Recommended)
              </button>
              <button
                onClick={() => {
                  console.log('🎯 Custom Build button (below templates) clicked');
                  console.log('🎯 onOpenAdvancedQuoteBuilder exists?', !!onOpenAdvancedQuoteBuilder);
                  if (onOpenAdvancedQuoteBuilder) {
                    console.log('🚀 Calling onOpenAdvancedQuoteBuilder()');
                    onOpenAdvancedQuoteBuilder();
                  } else {
                    setUseTemplate(false);
                  }
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                ⚙️ Custom Build
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Custom Configuration</h3>
              <p className="text-gray-600">
                You'll be able to enter your exact requirements in the next steps
              </p>
            </div>
            
            {/* Action Buttons for Custom Build */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setUseTemplate(true)}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                ⚡ Start from Template (Recommended)
              </button>
              <button
                onClick={() => {
                  if (onOpenAdvancedQuoteBuilder) {
                    onOpenAdvancedQuoteBuilder();
                  } else {
                    setUseTemplate(false);
                  }
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
              >
                ⚙️ Custom Build
              </button>
            </div>
          </>
        )}
      </div>

      {/* Industry Standards Badge - Moved to bottom */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-3">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">🔬</span>
          <span className="font-bold text-blue-800">Industry Standards Validated Templates</span>
        </div>
        <div className="text-sm text-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-semibold text-blue-600">NREL ATB 2024</div>
            <div className="text-xs">Power sizing standards</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">ASHRAE 90.1</div>
            <div className="text-xs">Equipment standards</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">IEEE 2450</div>
            <div className="text-xs">BESS performance</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">DOE/EIA CBECS</div>
            <div className="text-xs">Usage patterns</div>
          </div>
        </div>
      </div>

      {/* Template info */}
      {useTemplate && selectedTemplate && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 animate-fadeIn">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">✨</span>
            <div>
              <h4 className="font-bold text-green-900 mb-2">
                {Array.isArray(selectedTemplate) && selectedTemplate.length > 1 
                  ? `${selectedTemplate.length} Templates Selected!` 
                  : 'Template Selected!'}
              </h4>
              <p className="text-gray-700 mb-3">
                {Array.isArray(selectedTemplate) && selectedTemplate.length > 1 ? (
                  <>We've selected templates for: {selectedTemplate.map(id => templates.find(t => t.id === id)?.name).join(', ')}. You can adjust values in the next steps.</>
                ) : (
                  <>We've pre-filled typical values for {templates.find(t => t.id === (Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate))?.name}.</>
                )}
 
                You can adjust everything in the next steps to match your specific needs.
              </p>
              
              {/* Industry Standards Validation Badge */}
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-600">🔬</span>
                  <span className="text-sm font-semibold text-blue-800">Industry Standards Validated</span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Power sizing: NREL Commercial Reference Buildings</div>
                  <div>• Equipment loads: ASHRAE 90.1 & EPRI Database</div>
                  <div>• Financial parameters: DOE/EIA utility rate studies</div>
                  <div>• Performance metrics: IEEE 2450 BESS standards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1_IndustryTemplate;
