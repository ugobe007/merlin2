import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import AISquareFootageCalculator from './AISquareFootageCalculator';
import type { CustomQuestion } from '@/types/useCase.types';

interface QuestionRendererProps {
  question: CustomQuestion;
  value: any;
  selectedIndustry: string;
  useCaseData: { [key: string]: any };
  onChange: (questionId: string, value: any) => void;
}

/**
 * Reusable component for rendering different question types
 * in the wizard Step 2 use case questionnaires
 * 
 * Supports:
 * - number: Numeric input with optional suffix and AI calculator
 * - select: Single-select dropdown
 * - multi-select: Checkbox group for multiple selections
 * 
 * Handles conditional rendering based on other field values
 */
const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  selectedIndustry,
  useCaseData,
  onChange,
}) => {
  const [showAIHelper, setShowAIHelper] = useState(false);

  // Check if question should be shown based on conditional logic
  const shouldShowQuestion = (): boolean => {
    if (!question.conditional) return true;

    const { field, operator, value: conditionalValue, dependsOn } = question.conditional;

    // Handle dependsOn syntax (legacy)
    if (dependsOn) {
      const dependentValue = useCaseData[dependsOn];
      return dependentValue === conditionalValue;
    }

    // Handle field + operator syntax
    if (field && operator !== undefined) {
      const fieldValue = useCaseData[field];
      
      switch (operator) {
        case '>':
          return parseFloat(fieldValue) > conditionalValue;
        case '==':
          return fieldValue === conditionalValue;
        case '!=':
          return fieldValue !== conditionalValue;
        case '<':
          return parseFloat(fieldValue) < conditionalValue;
        case '>=':
          return parseFloat(fieldValue) >= conditionalValue;
        default:
          return true;
      }
    }

    return true;
  };

  if (!shouldShowQuestion()) {
    return null;
  }

  const handleInputChange = (newValue: any) => {
    onChange(question.id, newValue);
  };

  // AI Helper suggestions based on question type
  const getAISuggestion = (): string => {
    const questionId = question.id;
    const questionLabel = (question.label || question.question || '').toLowerCase();

    // Context-aware AI suggestions
    if (questionId === 'squareFootage' || questionLabel.includes('square footage')) {
      return "I can calculate square footage from your building dimensions (length × width).";
    }
    if (questionId === 'peakLoad' || questionLabel.includes('peak') || questionLabel.includes('demand')) {
      return "I can estimate your peak load based on facility size and type. Check your utility bill for actual values.";
    }
    if (questionId === 'demandCharge' || questionLabel.includes('demand charge')) {
      return "I can help you find your demand charge rate from your utility bill. It's usually listed as $/kW.";
    }
    if (questionLabel.includes('hours') || questionLabel.includes('operating')) {
      return "I can suggest typical operating hours for your industry type.";
    }
    if (questionLabel.includes('cost') || questionLabel.includes('bill')) {
      return "I can help you analyze your utility bill to find this value.";
    }
    if (questionLabel.includes('capacity') || questionLabel.includes('grid')) {
      return "I can help determine if you have grid capacity constraints based on your utility service.";
    }
    
    return "I can provide typical values for your industry and help you make an informed estimate.";
  };

  const handleAIAssist = () => {
    setShowAIHelper(!showAIHelper);
  };

  // Get intelligent AI suggestion based on question context
  const getIntelligentSuggestion = (): number | null => {
    const questionId = question.id;
    const questionLabel = (question.label || question.question || '').toLowerCase();
    
    // === COMMON NUMERIC FIELDS (BY ID) ===
    
    // Server racks (datacenters)
    if (questionId === 'rackCount') return 400;
    
    // Bed count (hospitals)
    if (questionId === 'bedCount') return 200;
    
    // Number of units (apartments)
    if (questionId === 'numberOfUnits') return 100;
    
    // Hotel rooms
    if (questionId === 'numberOfRooms') return 150;
    
    // Student enrollment (colleges)
    if (questionId === 'studentEnrollment') return 5000;
    
    // Residential population (colleges)
    if (questionId === 'residentialPopulation') return 2000;
    
    // Patient capacity (dental)
    if (questionId === 'patientCapacity') return 20;
    
    // Number of bays (car wash)
    if (questionId === 'num_bays') return 6;
    
    // Cars per day (car wash)
    if (questionId === 'cars_per_day') return 150;
    
    // Number of pumps (gas station)
    if (questionId === 'numPumps') return 8;
    
    // Gaming floor size (casino) - in sq ft
    if (questionId === 'gamingFloorSize') return 50000;
    
    // Revenue exposure (casino) - dollars per hour
    if (questionId === 'revenueExposure') return 10000;
    
    // Plant size (manufacturing) - sq ft
    if (questionId === 'plantSize') return 100000;
    
    // Number of shifts (manufacturing)
    if (questionId === 'numShifts') return 2;
    
    // Downtime cost (manufacturing) - dollars per hour
    if (questionId === 'downtimeCost') return 5000;
    
    // Irrigation load (agriculture) - kW
    if (questionId === 'irrigationLoad') return 150;
    
    // Processing capacity (food processing) - tons/day
    if (questionId === 'processingCapacity') return 100;
    
    // Cold storage size (food processing) - sq ft
    if (questionId === 'coldStorageSize') return 20000;
    
    // Cultivation area (indoor farm) - sq ft
    if (questionId === 'cultivationArea') return 10000;
    
    // Parking spaces
    if (questionId === 'parkingSpaces') return 100;
    
    // Building stories (apartments)
    if (questionId === 'buildingStories') return 3;
    
    // EV charging ports
    if (questionId === 'evChargingPorts') return 10;
    
    // Annual passenger volume (airport) - millions
    if (questionId === 'annualPassengerVolume') return 5;
    
    // Runway operations (airport) - per day
    if (questionId === 'runwayOperations') return 200;
    
    // Operating days per week (dental)
    if (questionId === 'operatingDays') return 5;
    
    // Daily charging events (EV)
    if (questionId === 'dailyChargingEvents') return 50;
    
    // DC Fast Chargers (EV)
    if (questionId === 'numberOfDCFastChargers') return 10;
    
    // Level 2 Chargers (EV)
    if (questionId === 'numberOfLevel2Chargers') return 20;
    
    // Average occupancy (hotel) - percentage
    if (questionId === 'averageOccupancy') return 70;
    
    // Resilience hours (government/critical facilities)
    if (questionId === 'resilienceHours') return 4;
    
    // === UNIVERSAL FIELDS (BY ID OR LABEL) ===
    
    // Peak Load / Demand suggestions based on industry
    if (questionId === 'peakLoad' || questionLabel.includes('peak') || (questionLabel.includes('load') && !questionLabel.includes('irrigation'))) {
      const industryDefaults: { [key: string]: number } = {
        'retail': 0.45,
        'gas-station': 0.25,
        'warehouse': 1.2,
        'logistics-center': 2.2,
        'manufacturing': 3.5,
        'tribal-casino': 5.0,
        'government': 0.6,
        'agriculture': 0.8,
        'shopping-center': 1.8,
        'hotel': 1.5,
        'hospital': 2.5,
        'datacenter': 5.0,
        'data-center': 5.0,
        'office': 0.8,
        'car-wash': 0.2,
        'ev-charging': 1.3,
        'indoor-farm': 0.5,
        'airport': 10.0,
        'college': 3.0,
        'dental-office': 0.05,
        'food-processing': 2.0,
        'apartments': 1.0,
      };
      return industryDefaults[selectedIndustry] || 1.0;
    }
    
    // Demand Charge Rate suggestions (typical US commercial rates)
    if (questionId === 'demandCharge' || questionLabel.includes('demand charge')) {
      return 15; // Typical $15/kW demand charge
    }
    
    // Operating Hours suggestions
    if (questionId === 'operatingHours' || questionLabel.includes('operating hours') || questionLabel.includes('daily operating')) {
      const hoursDefaults: { [key: string]: number } = {
        'retail': 12,
        'gas-station': 18,
        'warehouse': 16,
        'logistics-center': 20,
        'manufacturing': 16,
        'tribal-casino': 24,
        'government': 10,
        'agriculture': 10,
        'shopping-center': 14,
        'hotel': 24,
        'hospital': 24,
        'datacenter': 24,
        'data-center': 24,
        'office': 10,
        'car-wash': 12,
        'ev-charging': 16,
        'indoor-farm': 24,
        'airport': 24,
        'college': 16,
        'dental-office': 10,
        'food-processing': 16,
        'apartments': 24,
      };
      return hoursDefaults[selectedIndustry] || 12;
    }
    
    // Grid Capacity (0 means unlimited)
    if (questionId === 'gridCapacity' || questionLabel.includes('grid capacity') || questionLabel.includes('grid connection capacity')) {
      return 0; // Default to unlimited unless user specifies
    }
    
    // Power Usage Effectiveness (PUE) for datacenters
    if (questionId === 'powerUsageEffectiveness' || questionLabel.includes('pue') || questionLabel.includes('power usage effectiveness')) {
      return 1.6; // Industry standard for well-designed datacenter (1.2-2.0 range)
    }
    
    // Acreage for farms
    if (questionId === 'acreage' || questionLabel.includes('acreage')) {
      return 500;
    }
    
    // Facility Size (covers both facilitySize and square footage)
    if (questionId === 'facilitySize' || questionId === 'squareFootage' || questionLabel.includes('facility size') || questionLabel.includes('square footage') || questionLabel.includes('store square')) {
      // Skip if it's the calculator version
      if (questionId === 'totalSquareFootage') {
        return null;
      }
      
      const sqftDefaults: { [key: string]: number } = {
        'retail': 25000,
        'gas-station': 3000,
        'warehouse': 200000,
        'logistics-center': 500000,
        'manufacturing': 100000,
        'government': 50000,
        'shopping-center': 100000,
        'hotel': 75000,
        'hospital': 150000,
        'datacenter': 50000,
        'data-center': 50000,
        'office': 40000,
        'car-wash': 5000,
        'ev-charging': 10000,
        'indoor-farm': 25000,
        'airport': 500000,
        'college': 300000,
        'dental-office': 3000,
        'food-processing': 100000,
        'apartments': 50000,
        'tribal-casino': 100000,
        'agriculture': 50000,
      };
      return sqftDefaults[selectedIndustry] || 50000;
    }
    
    // EV Fleet Size
    if (questionId === 'evFleetSize' || questionId === 'evFleetPlan' || questionLabel.includes('fleet') || questionLabel.includes('vehicle')) {
      if (selectedIndustry === 'logistics-center') return 100;
      if (selectedIndustry === 'warehouse') return 20;
      return 10;
    }
    
    // Backup duration hours
    if (questionId === 'backupDuration' || (questionLabel.includes('backup') && (questionLabel.includes('hours') || questionLabel.includes('duration')))) {
      if (selectedIndustry === 'tribal-casino') return 4;
      if (selectedIndustry === 'hospital') return 8;
      if (selectedIndustry === 'datacenter' || selectedIndustry === 'data-center') return 4;
      return 2;
    }
    
    return null;
  };

  const handleApplySuggestion = () => {
    console.log('🤖 [AI Helper] handleApplySuggestion called for question:', question.id);
    const suggestion = getIntelligentSuggestion();
    console.log('🤖 [AI Helper] Suggestion value:', suggestion);
    if (suggestion !== null) {
      console.log('🤖 [AI Helper] Applying suggestion via onChange:', { questionId: question.id, value: suggestion });
      onChange(question.id, suggestion);
      setShowAIHelper(false);
    } else {
      console.log('❌ [AI Helper] No suggestion available for this question');
    }
  };

  // Render based on question type
  switch (question.type) {
    case 'number':
      const isSquareFootage = question.id === 'squareFootage';
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <label className="block text-lg font-semibold text-gray-800">
              {question.label || question.question}
            </label>
            {/* AI Helper Button - Small Green Button */}
            <button
              onClick={handleAIAssist}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              title="Get AI help with this question"
            >
              <Bot className="w-4 h-4" />
              <Sparkles className="w-3 h-3" />
              <span>AI Help</span>
            </button>
          </div>
          {question.helpText && (
            <p className="text-sm text-gray-600 mb-3">{question.helpText}</p>
          )}
          
          {/* AI Helper Panel */}
          {showAIHelper && (
            <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">AI Assistant</h4>
                  <p className="text-sm text-gray-700">{getAISuggestion()}</p>
                  {isSquareFootage && (
                    <div className="mt-3">
                      <AISquareFootageCalculator 
                        onCalculate={(sqft: number) => {
                          handleInputChange(sqft);
                          setShowAIHelper(false);
                        }}
                        industryType={selectedIndustry}
                      />
                    </div>
                  )}
                  {!isSquareFootage && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={handleApplySuggestion}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
                      >
                        Apply Typical Value for {selectedIndustry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                      <p className="text-xs text-gray-600 text-center">
                        💡 This will fill in industry-standard values. You can adjust afterwards.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleInputChange(parseFloat(e.target.value) || 0)}
              placeholder={question.placeholder}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
            />
            {(question.suffix || question.unit) && (
              <span className="text-gray-600 font-medium">{question.suffix || question.unit}</span>
            )}
          </div>
        </div>
      );

    case 'select':
      // Convert simple string array to {label, value} format if needed
      const selectOptions = question.options?.map((opt: string | { value: string; label: string }) => 
        typeof opt === 'string' ? { value: opt, label: opt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) } : opt
      ) || [];
      
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors"
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {question.label || question.question}
          </label>
          {question.helpText && (
            <p className="text-sm text-gray-600 mb-3">{question.helpText}</p>
          )}
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select an option...</option>
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'multi-select':
    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : [];
      // Convert simple string array to {label, value} format if needed
      const multiOptions = question.options?.map((opt: string | { value: string; label: string }) => 
        typeof opt === 'string' ? { value: opt, label: opt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) } : opt
      ) || [];
      
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200"
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {question.label || question.question}
          </label>
          {question.helpText && (
            <p className="text-sm text-gray-600 mb-3">{question.helpText}</p>
          )}
          <div className="space-y-2">
            {multiOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter((v) => v !== opt.value);
                    handleInputChange(newValues);
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

export default QuestionRenderer;
