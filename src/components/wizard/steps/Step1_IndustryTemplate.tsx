import React from 'react';

interface Step1_IndustryTemplateProps {
  selectedTemplate: string | string[];
  setSelectedTemplate: (value: string | string[]) => void;
  useTemplate: boolean;
  setUseTemplate: (value: boolean) => void;
}

const Step1_IndustryTemplate: React.FC<Step1_IndustryTemplateProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  useTemplate,
  setUseTemplate,
}) => {
  console.log('🔄 Step1 RENDER - selectedTemplate:', selectedTemplate);
  
  const templates = [
    {
      id: 'manufacturing',
      icon: '🏭',
      name: 'Manufacturing Facility',
      description: 'High power demand with predictable schedules',
      typical: '2-5 MW / 4-6 hours',
      savings: '$75K-200K/year',
      color: 'blue'
    },
    {
      id: 'office',
      icon: '🏢',
      name: 'Office Building',
      description: 'Commercial real estate with steady daytime load',
      typical: '500 kW - 2 MW / 2-4 hours',
      savings: '$25K-75K/year',
      color: 'cyan'
    },
    {
      id: 'datacenter',
      icon: '💻',
      name: 'Data Center',
      description: '24/7 operations requiring backup power',
      typical: '5-20 MW / 4-8 hours',
      savings: '$200K-1M/year',
      color: 'purple'
    },
    {
      id: 'warehouse',
      icon: '📦',
      name: 'Warehouse/Distribution',
      description: 'Logistics facilities with peak demand',
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
      id: 'university',
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
      gray: {
        bg: isSelected ? 'bg-gradient-to-br from-gray-100 to-slate-100' : 'bg-white',
        border: isSelected ? 'border-gray-600' : 'border-gray-300 hover:border-gray-500',
        shadow: isSelected ? 'shadow-lg shadow-gray-300/50' : 'hover:shadow-md'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">
          Quick Configuration
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Start with an industry template or build your own custom configuration
        </p>
      </div>

      {/* Path Selection */}
      <div className="bg-white rounded-xl border-2 border-blue-400 p-6 shadow-lg">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setUseTemplate(true)}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              useTemplate
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            ⚡ Start from Template (Recommended)
          </button>
          <button
            onClick={() => setUseTemplate(false)}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              !useTemplate
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            ⚙️ Custom Build
          </button>
        </div>

        {useTemplate ? (
          <>
            <p className="text-center text-gray-600 mb-6">
              🚨 TESTING VERSION 2.0 🚨 Choose one or more industries to get started with pre-configured values (click to select/deselect)
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {templates.map((template) => {
                const selectedArray = Array.isArray(selectedTemplate) ? selectedTemplate : (selectedTemplate ? [selectedTemplate] : []);
                const isSelected = selectedArray.includes(template.id);
                console.log(`🎨 Rendering ${template.id}:`, { selectedTemplate, selectedArray, isSelected });
                const colorClasses = getColorClasses(template.color, isSelected);
                
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      const currentSelection = Array.isArray(selectedTemplate) ? selectedTemplate : (selectedTemplate ? [selectedTemplate] : []);
                      console.log('🔍 Before click:', { currentSelection, clickedId: template.id });
                      
                      if (currentSelection.includes(template.id)) {
                        // Remove if already selected
                        const newSelection = currentSelection.filter(id => id !== template.id);
                        console.log('❌ Removing:', { newSelection });
                        setSelectedTemplate(newSelection);
                        console.log('📤 Called setSelectedTemplate with:', newSelection);
                      } else {
                        // Add to selection
                        const newSelection = [...currentSelection, template.id];
                        console.log('✅ Adding:', { newSelection });
                        setSelectedTemplate(newSelection);
                        console.log('📤 Called setSelectedTemplate with:', newSelection);
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
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Custom Configuration</h3>
            <p className="text-gray-600">
              You'll be able to enter your exact requirements in the next steps
            </p>
          </div>
        )}
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
              <p className="text-gray-700">
                {Array.isArray(selectedTemplate) && selectedTemplate.length > 1 ? (
                  <>We've selected templates for: {selectedTemplate.map(id => templates.find(t => t.id === id)?.name).join(', ')}. You can adjust values in the next steps.</>
                ) : (
                  <>We've pre-filled typical values for {templates.find(t => t.id === (Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate))?.name}.</>
                )}
 
                You can adjust everything in the next steps to match your specific needs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1_IndustryTemplate;
