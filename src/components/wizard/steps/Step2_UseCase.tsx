import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, TrendingUp } from 'lucide-react';

interface Step2_UseCaseProps {
  selectedIndustry: string;
  useCaseData: { [key: string]: any };
  setUseCaseData: (data: { [key: string]: any }) => void;
  aiRecommendation?: {
    message: string;
    savings: string;
    roi: string;
    configuration: string;
  } | null;
}

const Step2_UseCase: React.FC<Step2_UseCaseProps> = ({
  selectedIndustry,
  useCaseData,
  setUseCaseData,
  aiRecommendation,
}) => {
  const [showAIGuidance, setShowAIGuidance] = useState(false);

  // Show AI guidance when user completes questions
  useEffect(() => {
    const hasAnswers = Object.keys(useCaseData).length > 0;
    if (hasAnswers) {
      setShowAIGuidance(true);
    }
  }, [useCaseData]);

  const handleInputChange = (key: string, value: any) => {
    setUseCaseData({ ...useCaseData, [key]: value });
  };

  // Industry-specific questions
  const getQuestionsForIndustry = () => {
    switch (selectedIndustry) {
      case 'ev-charging':
        return {
          title: 'EV Charging Station Details',
          icon: '🔌',
          questions: [
            {
              id: 'numChargers',
              label: 'How many charging stations?',
              type: 'number',
              placeholder: 'e.g., 10',
              suffix: 'chargers',
            },
            {
              id: 'chargerType',
              label: 'What type of chargers?',
              type: 'select',
              options: [
                { value: 'level2', label: 'Level 2 (7-19 kW)' },
                { value: 'dcfast', label: 'DC Fast Charging (50-350 kW)' },
                { value: 'mixed', label: 'Mixed (Level 2 + DC Fast)' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Connected to utility)' },
                { value: 'off-grid', label: 'Off-Grid (Standalone)' },
                { value: 'limited', label: 'Limited Grid Capacity' },
              ],
            },
            {
              id: 'peakHours',
              label: 'Peak usage hours per day?',
              type: 'number',
              placeholder: 'e.g., 8',
              suffix: 'hours',
            },
          ],
          insights: {
            'level2-on-grid': 'Level 2 chargers work great with solar+storage for daytime charging',
            'dcfast-limited': 'DC Fast charging with limited grid? Battery storage is essential to avoid demand charges',
            'off-grid': 'Off-grid EV charging requires significant battery capacity + renewable generation',
          },
        };

      case 'car-wash':
        return {
          title: 'Car Wash Operation Details',
          icon: '🚗',
          questions: [
            {
              id: 'numBays',
              label: 'Number of wash bays?',
              type: 'number',
              placeholder: 'e.g., 3',
              suffix: 'bays',
            },
            {
              id: 'washType',
              label: 'Type of car wash?',
              type: 'select',
              options: [
                { value: 'self-serve', label: 'Self-Serve' },
                { value: 'automatic', label: 'Automatic/Touchless' },
                { value: 'full-service', label: 'Full-Service with Detail' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'off-grid', label: 'Off-Grid (Standalone)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'operatingHours',
              label: 'Operating hours per day?',
              type: 'number',
              placeholder: 'e.g., 12',
              suffix: 'hours',
            },
            {
              id: 'heatedWater',
              label: 'Do you use heated water?',
              type: 'select',
              options: [
                { value: 'yes', label: 'Yes (Higher energy use)' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
          insights: {
            'automatic-yes': 'Automatic washes with heating have 30-45 min peak demand cycles - perfect for battery smoothing',
            'self-serve': 'Self-serve washes benefit from solar+storage to offset daytime utility costs',
            'off-grid': 'Off-grid car washes need reliable battery+solar systems for consistent operation',
          },
        };

      case 'hotel':
        return {
          title: 'Hotel Facility Details',
          icon: '🏨',
          questions: [
            {
              id: 'numRooms',
              label: 'How many rooms?',
              type: 'number',
              placeholder: 'e.g., 120',
              suffix: 'rooms',
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'off-grid', label: 'Off-Grid (Standalone)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'occupancyRate',
              label: 'Average occupancy rate?',
              type: 'select',
              options: [
                { value: 'high', label: 'High (75-100%)' },
                { value: 'medium', label: 'Medium (50-75%)' },
                { value: 'seasonal', label: 'Seasonal/Variable' },
                { value: 'low', label: 'Low (< 50%)' },
              ],
            },
            {
              id: 'amenities',
              label: 'Major amenities? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'pool', label: '🏊 Pool/Spa' },
                { value: 'restaurant', label: '🍽️ Restaurant/Kitchen' },
                { value: 'hvac', label: '❄️ Central HVAC' },
                { value: 'ev-charging', label: '🔌 EV Charging' },
                { value: 'laundry', label: '🧺 Commercial Laundry' },
              ],
            },
            {
              id: 'evChargers',
              label: 'Want to add EV charging for guests?',
              type: 'select',
              options: [
                { value: 'yes', label: 'Yes - How many chargers?' },
                { value: 'no', label: 'No' },
                { value: 'future', label: 'Maybe in the future' },
              ],
            },
            {
              id: 'numEVChargers',
              label: 'How many EV chargers? (if yes above)',
              type: 'number',
              placeholder: 'e.g., 4',
              suffix: 'chargers',
              conditional: { dependsOn: 'evChargers', value: 'yes' },
            },
            {
              id: 'utilityRate',
              label: 'Do you know your utility rate?',
              type: 'select',
              options: [
                { value: 'yes', label: 'Yes - I know my rate' },
                { value: 'no', label: 'No - Help me calculate' },
              ],
            },
            {
              id: 'kwhRate',
              label: 'Utility rate ($/kWh)',
              type: 'number',
              placeholder: 'e.g., 0.15',
              suffix: '$/kWh',
              conditional: { dependsOn: 'utilityRate', value: 'yes' },
            },
            {
              id: 'gridReliability',
              label: 'Grid reliability in your area?',
              type: 'select',
              options: [
                { value: 'reliable', label: 'Reliable (Rare outages)' },
                { value: 'moderate', label: 'Moderate (Occasional outages)' },
                { value: 'unreliable', label: 'Unreliable (Frequent outages)' },
              ],
            },
          ],
          insights: {
            'pool-restaurant': 'Hotels with pools and restaurants typically use solar+storage for daytime load coverage',
            'unreliable': 'Unreliable grid? Backup power is critical for guest experience and refrigeration',
            'off-grid': 'Off-grid hotels need robust battery+solar+generator systems for 24/7 operations',
            'ev-charging': 'Adding EV charging? We can size your system to handle both hotel and charging loads',
          },
        };

      case 'datacenter':
        return {
          title: 'Data Center Specifications',
          icon: '🖥️',
          questions: [
            {
              id: 'capacity',
              label: 'Total IT capacity?',
              type: 'number',
              placeholder: 'e.g., 5',
              suffix: 'MW',
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'redundant', label: 'Redundant Grid Feeds (2+)' },
                { value: 'single', label: 'Single Grid Connection' },
                { value: 'limited', label: 'Limited Grid Capacity' },
                { value: 'microgrid', label: 'Microgrid/Off-Grid Required' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'uptimeRequirement',
              label: 'Uptime requirement?',
              type: 'select',
              options: [
                { value: 'tier1', label: 'Tier I (99.671% - 28.8 hrs downtime/year)' },
                { value: 'tier2', label: 'Tier II (99.741% - 22 hrs downtime/year)' },
                { value: 'tier3', label: 'Tier III (99.982% - 1.6 hrs downtime/year)' },
                { value: 'tier4', label: 'Tier IV (99.995% - 26 min downtime/year)' },
              ],
            },
            {
              id: 'coolingSystem',
              label: 'Cooling system type?',
              type: 'select',
              options: [
                { value: 'air', label: 'Air-cooled' },
                { value: 'liquid', label: 'Liquid-cooled' },
                { value: 'hybrid', label: 'Hybrid' },
              ],
            },
          ],
          insights: {
            'microgrid': 'Microgrids for datacenters require significant battery+generation for continuous uptime',
            'tier4': 'Tier IV datacenters need robust backup systems - typically 2N or 2N+1 redundancy',
            'limited': 'Limited grid capacity? Battery+solar reduces grid dependency during peak compute loads',
          },
        };

      case 'hospital':
        return {
          title: 'Healthcare Facility Details',
          icon: '🏥',
          questions: [
            {
              id: 'bedCount',
              label: 'Number of beds?',
              type: 'number',
              placeholder: 'e.g., 200',
              suffix: 'beds',
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'off-grid', label: 'Off-Grid (Standalone)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Robust Backup)' },
              ],
            },
            {
              id: 'criticalSystems',
              label: 'Critical systems? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'icu', label: '🫀 ICU/Critical Care' },
                { value: 'surgery', label: '⚕️ Operating Rooms' },
                { value: 'imaging', label: '📷 MRI/CT/Imaging' },
                { value: 'lab', label: '🔬 Laboratory' },
                { value: 'pharmacy', label: '💊 Pharmacy (Refrigeration)' },
              ],
            },
            {
              id: 'backupPower',
              label: 'Current backup power?',
              type: 'select',
              options: [
                { value: 'generator-only', label: 'Generator Only' },
                { value: 'ups-generator', label: 'UPS + Generator' },
                { value: 'none', label: 'None/Inadequate' },
              ],
            },
            {
              id: 'backupDuration',
              label: 'Required backup duration?',
              type: 'select',
              options: [
                { value: '4hr', label: '4 hours (Minimum)' },
                { value: '8hr', label: '8 hours (Standard)' },
                { value: '24hr', label: '24+ hours (Extended)' },
              ],
            },
          ],
          insights: {
            'icu-surgery': 'ICU and surgery require instant switchover - BESS is faster than generator startup (10-15 sec)',
            '24hr': '24+ hour backup? Combine BESS with generator for cost-effective extended runtime',
            'off-grid': 'Off-grid hospitals need 2N redundancy with battery+solar+generator for life-safety systems',
          },
        };

      case 'airport':
        return {
          title: 'Airport Facility Details',
          icon: '✈️',
          questions: [
            {
              id: 'facilityType',
              label: 'Facility type?',
              type: 'select',
              options: [
                { value: 'terminal', label: 'Terminal Building' },
                { value: 'hangar', label: 'Hangar/Maintenance' },
                { value: 'ground-ops', label: 'Ground Operations' },
                { value: 'full-airport', label: 'Full Airport Complex' },
              ],
            },
            {
              id: 'operationSize',
              label: 'Operation size?',
              type: 'select',
              options: [
                { value: 'small', label: 'Small (< 500K passengers/year)' },
                { value: 'medium', label: 'Medium (500K - 5M passengers/year)' },
                { value: 'large', label: 'Large (> 5M passengers/year)' },
              ],
            },
            {
              id: 'criticalLoads',
              label: 'Critical loads? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'atc', label: '🗼 Air Traffic Control' },
                { value: 'lighting', label: '💡 Runway Lighting' },
                { value: 'fueling', label: '⛽ Fueling Systems' },
                { value: 'baggage', label: '🧳 Baggage Handling' },
                { value: 'security', label: '🔒 Security Systems' },
              ],
            },
          ],
          insights: {
            'atc-lighting': 'ATC and runway lighting are FAA-mandated critical loads - require instant backup',
            'full-airport': 'Full airport operations benefit from microgrid architecture with BESS+solar+generator',
          },
        };

      default:
        return {
          title: 'Project Details',
          icon: '⚡',
          questions: [
            {
              id: 'facilitySize',
              label: 'Facility size?',
              type: 'select',
              options: [
                { value: 'small', label: 'Small (< 50,000 sq ft)' },
                { value: 'medium', label: 'Medium (50,000 - 200,000 sq ft)' },
                { value: 'large', label: 'Large (> 200,000 sq ft)' },
              ],
            },
            {
              id: 'peakLoad',
              label: 'Estimated peak load?',
              type: 'number',
              placeholder: 'e.g., 1.5',
              suffix: 'MW',
            },
            {
              id: 'operatingHours',
              label: 'Operating hours per day?',
              type: 'number',
              placeholder: 'e.g., 16',
              suffix: 'hours',
            },
          ],
          insights: {},
        };
    }
  };

  const industryConfig = getQuestionsForIndustry();

  const renderQuestion = (question: any) => {
    const value = useCaseData[question.id] || '';

    switch (question.type) {
      case 'number':
        return (
          <div key={question.id} className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {question.label}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={value}
                onChange={(e) => handleInputChange(question.id, parseFloat(e.target.value) || 0)}
                placeholder={question.placeholder}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
              />
              {question.suffix && (
                <span className="text-gray-600 font-medium">{question.suffix}</span>
              )}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {question.label}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Select an option...</option>
              {question.options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multi-select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={question.id} className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {question.label}
            </label>
            <div className="space-y-2">
              {question.options.map((opt: any) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt.value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, opt.value]
                        : selectedValues.filter((v) => v !== opt.value);
                      handleInputChange(question.id, newValues);
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{industryConfig.icon}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {industryConfig.title}
        </h2>
        <p className="text-gray-600 text-lg">
          Tell us about your operation so we can recommend the optimal configuration
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {industryConfig.questions.map((question) => renderQuestion(question))}
      </div>

      {/* AI Guidance (appears after answers) */}
      {showAIGuidance && aiRecommendation && (
        <div className="mt-8 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-8 border-2 border-purple-300 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                AI Recommendation for Your Project
              </h3>
              
              <div className="bg-white rounded-xl p-6 mb-4 shadow-md">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {aiRecommendation.message}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-100 rounded-xl p-4 border-2 border-green-300">
                  <div className="text-green-700 font-semibold text-sm mb-1">Potential Savings</div>
                  <div className="text-2xl font-bold text-green-900">{aiRecommendation.savings}</div>
                </div>
                <div className="bg-blue-100 rounded-xl p-4 border-2 border-blue-300">
                  <div className="text-blue-700 font-semibold text-sm mb-1">ROI Timeline</div>
                  <div className="text-2xl font-bold text-blue-900">{aiRecommendation.roi}</div>
                </div>
                <div className="bg-purple-100 rounded-xl p-4 border-2 border-purple-300">
                  <div className="text-purple-700 font-semibold text-sm mb-1">Recommended System</div>
                  <div className="text-xl font-bold text-purple-900">{aiRecommendation.configuration}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm">Based on industry benchmarks and your specific use case</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2_UseCase;
