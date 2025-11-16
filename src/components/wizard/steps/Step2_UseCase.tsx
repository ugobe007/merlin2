import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, TrendingUp, Bot } from 'lucide-react';
import { aiStateService } from '@/services/aiStateService';
import AIStatusIndicator from '../AIStatusIndicator';
import AISquareFootageCalculator from '../AISquareFootageCalculator';

// Import use case images with explicit extensions for Vite
import evChargingStationImage from '@/assets/images/ev_charging_station.png?url';
import carWashImage from '@/assets/images/car_wash_1.jpg?url';
import hospitalImage from '@/assets/images/hospital_1.jpg?url';
import hotelImage from '@/assets/images/hotel_1.avif?url';
import airportImage from '@/assets/images/airports_1.jpg?url';

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
  // Optional: Allow AI to auto-configure system from this step
  setStorageSizeMW?: (value: number) => void;
  setDurationHours?: (value: number) => void;
  onAdvanceToConfiguration?: () => void;
}

const Step2_UseCase: React.FC<Step2_UseCaseProps> = ({ 
  selectedIndustry, 
  useCaseData, 
  setUseCaseData, 
  aiRecommendation,
  setStorageSizeMW,
  setDurationHours,
  onAdvanceToConfiguration,
}) => {
  // Helper function to get industry image
  const getIndustryImage = (industry: string): string | null => {
    switch (industry) {
      case 'ev-charging':
        return evChargingStationImage;
      case 'car-wash':
        return carWashImage;
      case 'hospital':
        return hospitalImage;
      case 'hotel':
        return hotelImage;
      case 'airport':
        return airportImage;
      default:
        return null;
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);

  // Extract MW and hours from AI configuration string
  const parseAIConfiguration = (configString: string) => {
    if (!configString) return null;
    
    const mwMatch = configString.match(/(\d+\.?\d*)MW/);
    const hrMatch = configString.match(/(\d+)hr/);
    
    if (mwMatch && hrMatch) {
      return {
        mw: parseFloat(mwMatch[1]),
        hours: parseInt(hrMatch[1])
      };
    }
    return null;
  };

  const aiConfig = aiRecommendation ? parseAIConfiguration(aiRecommendation.configuration) : null;

  const handleAcceptAIConfiguration = () => {
    if (aiConfig && setStorageSizeMW && setDurationHours) {
      setIsApplyingAI(true);
      
      // Apply the configuration
      setStorageSizeMW(aiConfig.mw);
      setDurationHours(aiConfig.hours);
      
      // Update AI state to applied
      aiStateService.setAIState('applied', {
        appliedConfig: `${aiConfig.mw}MW / ${aiConfig.hours}hr`
      });
      
      // Close modal and advance after brief delay
      setTimeout(() => {
        setShowConfirmModal(false);
        setIsApplyingAI(false);
        if (onAdvanceToConfiguration) {
          onAdvanceToConfiguration();
        }
      }, 1500);
    }
  };
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
          title: 'EV Charging Station Configuration',
          icon: '🔌',
          questions: [
            {
              id: 'stationType',
              label: 'What type of charging station?',
              type: 'select',
              options: [
                { value: 'public-highway', label: '🛣️ Public Highway/Travel Center' },
                { value: 'public-urban', label: '🏢 Public Urban/City Center' },
                { value: 'workplace', label: '🏢 Workplace/Corporate' },
                { value: 'retail', label: '🛒 Retail/Shopping Center' },
                { value: 'multifamily', label: '🏠 Multi-family Residential' },
                { value: 'fleet', label: '🚛 Fleet/Depot Charging' },
                { value: 'destination', label: '🏨 Destination (Hotel/Restaurant)' },
              ],
            },
            {
              id: 'level2Chargers',
              label: 'Level 2 Chargers (7-19 kW)',
              type: 'number',
              placeholder: 'e.g., 20',
              suffix: 'chargers',
            },
            {
              id: 'level2Power',
              label: 'Level 2 Power per Charger',
              type: 'select',
              options: [
                { value: '7', label: '7 kW (Basic Level 2)' },
                { value: '11', label: '11 kW (Standard Level 2)' },
                { value: '19', label: '19 kW (High-Power Level 2)' },
              ],
              conditional: { field: 'level2Chargers', operator: '>', value: 0 }
            },
            {
              id: 'dcFastChargers',
              label: 'DC Fast Chargers (50-350 kW)',
              type: 'number',
              placeholder: 'e.g., 8',
              suffix: 'chargers',
            },
            {
              id: 'dcFastPower',
              label: 'DC Fast Charger Power',
              type: 'select',
              options: [
                { value: '50', label: '50 kW (Standard DC Fast)' },
                { value: '150', label: '150 kW (High-Power DC Fast)' },
                { value: '250', label: '250 kW (Ultra-Fast)' },
                { value: '350', label: '350 kW (Ultra-Fast+)' },
              ],
              conditional: { field: 'dcFastChargers', operator: '>', value: 0 }
            },
            {
              id: 'utilizationProfile',
              label: 'Expected utilization pattern?',
              type: 'select',
              options: [
                { value: 'low', label: 'Low (10-25% avg utilization)' },
                { value: 'medium', label: 'Medium (25-50% avg utilization)' },
                { value: 'high', label: 'High (50-75% avg utilization)' },
                { value: 'very-high', label: 'Very High (75%+ avg utilization)' },
                { value: 'custom', label: 'Custom - I know my exact rates' },
              ],
            },
            {
              id: 'customUtilization',
              label: 'Average utilization rate (%)',
              type: 'number',
              placeholder: 'e.g., 65',
              suffix: '%',
              conditional: { field: 'utilizationProfile', operator: '==', value: 'custom' }
            },
            {
              id: 'peakConcurrency',
              label: 'Peak simultaneous charging (%)',
              type: 'select',
              options: [
                { value: '30', label: '30% (Rural/Low Traffic)' },
                { value: '50', label: '50% (Suburban/Medium Traffic)' },
                { value: '70', label: '70% (Urban/High Traffic)' },
                { value: '85', label: '85% (Highway/Travel Centers)' },
                { value: '100', label: '100% (Fleet/Depot - All at once)' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Full utility connection)' },
                { value: 'limited', label: 'Limited Grid (Capacity constraints)' },
                { value: 'off-grid', label: 'Off-Grid (Remote location)' },
                { value: 'microgrid', label: 'Microgrid (Local generation)' },
              ],
            },
            {
              id: 'operatingHours',
              label: 'Operating schedule?',
              type: 'select',
              options: [
                { value: '24-7', label: '24/7 (Always available)' },
                { value: 'extended', label: 'Extended (6 AM - 11 PM)' },
                { value: 'business', label: 'Business Hours (8 AM - 6 PM)' },
                { value: 'custom', label: 'Custom hours' },
              ],
            },
          ],
          insights: {
            'public-highway-high': 'Highway travel centers need robust power management - battery storage prevents grid overload during peak travel times',
            'fleet-100': 'Fleet charging at 100% concurrency requires significant demand management - storage reduces utility demand charges by 60-80%',
            'dcfast-limited': 'DC Fast charging with limited grid capacity? Battery storage is essential - can reduce grid demand by 2-3x',
            'level2-workplace': 'Workplace Level 2 charging pairs perfectly with solar+storage - charge during peak solar hours',
            'off-grid': 'Off-grid EV charging requires oversized battery + renewable generation (typically 2-3x normal capacity)',
            'ultra-fast': '250kW+ ultra-fast chargers create massive demand spikes - storage smooths power delivery and cuts demand charges',
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
              id: 'squareFootage',
              label: 'Facility square footage (optional)',
              type: 'number',
              placeholder: 'e.g., 50000',
              suffix: 'sq ft',
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
              id: 'squareFootage',
              label: 'Facility square footage (optional)',
              type: 'number',
              placeholder: 'e.g., 100000',
              suffix: 'sq ft',
            },
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

      case 'tribal-casino':
        return {
          title: 'Tribal Casino & Resort Details',
          icon: '🎰',
          questions: [
            {
              id: 'squareFootage',
              label: 'Total facility square footage (optional)',
              type: 'number',
              placeholder: 'e.g., 75000',
              suffix: 'sq ft',
            },
            {
              id: 'facilitySize',
              label: 'Facility size?',
              type: 'select',
              options: [
                { value: 'micro', label: 'Micro (< 15,000 sq ft gaming floor)' },
                { value: 'small', label: 'Small (15,000-40,000 sq ft gaming floor)' },
                { value: 'medium', label: 'Medium (40,000-100,000 sq ft)' },
                { value: 'large', label: 'Large (> 100,000 sq ft)' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'off-grid', label: 'Off-Grid (Remote location)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'amenities',
              label: 'Resort amenities? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'hotel', label: '🏨 Hotel/Rooms' },
                { value: 'restaurants', label: '🍽️ Multiple Restaurants' },
                { value: 'entertainment', label: '🎭 Entertainment Venue' },
                { value: 'spa', label: '💆 Spa/Pool' },
                { value: 'convention', label: '🎪 Convention Center' },
              ],
            },
            {
              id: 'operations',
              label: 'Operations schedule?',
              type: 'select',
              options: [
                { value: '24-7', label: '24/7 Operations' },
                { value: 'extended', label: 'Extended Hours (16-20 hrs/day)' },
              ],
            },
            {
              id: 'backupCritical',
              label: 'How critical is backup power?',
              type: 'select',
              options: [
                { value: 'mission-critical', label: 'Mission Critical (Gaming/Hospitality)' },
                { value: 'important', label: 'Important (Minimize downtime)' },
              ],
            },
          ],
          insights: {
            '24-7': '24/7 casinos need reliable backup power - even brief outages impact revenue significantly',
            'off-grid': 'Remote tribal casinos benefit from microgrid systems with solar+storage+generator',
            'mission-critical': 'Gaming operations require instant switchover - BESS responds in <10ms vs generators (10-15 sec)',
          },
        };

      case 'logistics-center':
        return {
          title: 'Logistics Center Details',
          icon: '🚚',
          questions: [
            {
              id: 'squareFootage',
              label: 'Facility square footage (optional)',
              type: 'number',
              placeholder: 'e.g., 200000',
              suffix: 'sq ft',
            },
            {
              id: 'facilityType',
              label: 'Facility type?',
              type: 'select',
              options: [
                { value: 'fulfillment', label: 'Fulfillment Center (Amazon-style)' },
                { value: 'distribution', label: 'Distribution Hub (FedEx/UPS)' },
                { value: 'cold-storage', label: 'Cold Storage/Refrigerated' },
                { value: 'warehouse', label: 'Standard Warehouse' },
              ],
            },
            {
              id: 'facilitySize',
              label: 'Facility size?',
              type: 'select',
              options: [
                { value: 'micro', label: 'Micro (< 50,000 sq ft)' },
                { value: 'small', label: 'Small (50,000-150,000 sq ft)' },
                { value: 'medium', label: 'Medium (150,000-350,000 sq ft)' },
                { value: 'large', label: 'Large (> 350,000 sq ft)' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'limited', label: 'Limited Grid Capacity' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'operations',
              label: 'Operations schedule?',
              type: 'select',
              options: [
                { value: '24-7', label: '24/7 Operations' },
                { value: '2-shift', label: 'Two Shifts (16 hrs/day)' },
                { value: '1-shift', label: 'Single Shift (8-10 hrs/day)' },
              ],
            },
            {
              id: 'criticalLoads',
              label: 'Critical loads? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'refrigeration', label: '❄️ Refrigeration/Cold Storage' },
                { value: 'automation', label: '🤖 Warehouse Automation' },
                { value: 'sorting', label: '📦 Sorting Systems' },
                { value: 'ev-fleet', label: '🔌 EV Fleet Charging' },
              ],
            },
          ],
          insights: {
            'cold-storage': 'Cold storage requires uninterrupted power - even brief outages can spoil inventory worth millions',
            'ev-fleet': 'EV fleet charging creates significant demand - battery storage helps manage peak charges',
            '24-7': '24/7 operations benefit from demand charge reduction through battery peak shaving',
          },
        };

      case 'shopping-center':
        return {
          title: 'Shopping Center/Mall Details',
          icon: '🏬',
          questions: [
            {
              id: 'squareFootage',
              label: 'Total leasable square footage (optional)',
              type: 'number',
              placeholder: 'e.g., 250000',
              suffix: 'sq ft',
            },
            {
              id: 'centerSize',
              label: 'Center size?',
              type: 'select',
              options: [
                { value: 'strip', label: 'Strip Center (< 100,000 sq ft)' },
                { value: 'community', label: 'Community Center (100,000-400,000 sq ft)' },
                { value: 'regional', label: 'Regional Mall (> 400,000 sq ft)' },
              ],
            },
            {
              id: 'numTenants',
              label: 'Approximate number of tenants?',
              type: 'number',
              placeholder: 'e.g., 25',
              suffix: 'tenants',
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'anchorTenants',
              label: 'Anchor tenants? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'grocery', label: '🛒 Grocery Store/Supermarket' },
                { value: 'department', label: '🏬 Department Store' },
                { value: 'cinema', label: '🎬 Movie Theater' },
                { value: 'gym', label: '💪 Fitness Center' },
                { value: 'restaurant', label: '🍽️ Food Court/Restaurants' },
              ],
            },
            {
              id: 'hvacLoad',
              label: 'HVAC load?',
              type: 'select',
              options: [
                { value: 'high', label: 'High (Central system for entire mall)' },
                { value: 'medium', label: 'Medium (Shared systems)' },
                { value: 'tenant-controlled', label: 'Tenant-Controlled' },
              ],
            },
          ],
          insights: {
            'grocery': 'Grocery stores have high refrigeration loads - backup power prevents inventory loss',
            'cinema': 'Movie theaters create peak demand during shows - battery storage can smooth these spikes',
            'regional': 'Regional malls benefit significantly from demand charge management using battery storage',
          },
        };

      case 'gas-station':
        return {
          title: 'Gas Station/C-Store Details',
          icon: '⛽',
          questions: [
            {
              id: 'stationType',
              label: 'Station type?',
              type: 'select',
              options: [
                { value: 'gas-only', label: 'Gas Pumps Only' },
                { value: 'with-cstore', label: 'Gas + Convenience Store' },
                { value: 'truck-stop', label: 'Truck Stop/Travel Center' },
              ],
            },
            {
              id: 'numPumps',
              label: 'Number of fuel pumps?',
              type: 'number',
              placeholder: 'e.g., 8',
              suffix: 'pumps',
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'off-grid', label: 'Off-Grid (Remote location)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup)' },
              ],
            },
            {
              id: 'operations',
              label: 'Operating hours?',
              type: 'select',
              options: [
                { value: '24-7', label: '24/7 Operations' },
                { value: 'extended', label: 'Extended Hours (16-20 hrs/day)' },
                { value: 'standard', label: 'Standard Hours (12-14 hrs/day)' },
              ],
            },
            {
              id: 'additionalServices',
              label: 'Additional services? (Select all that apply)',
              type: 'multi-select',
              options: [
                { value: 'car-wash', label: '🚗 Car Wash' },
                { value: 'ev-charging', label: '🔌 EV Charging Stations' },
                { value: 'restaurant', label: '🍔 Quick Service Restaurant' },
                { value: 'refrigeration', label: '❄️ Walk-in Refrigeration' },
              ],
            },
          ],
          insights: {
            'ev-charging': 'Adding EV charging? We can size your system to handle both gas and electric vehicle energy needs',
            'truck-stop': 'Truck stops with multiple services benefit from battery storage to manage complex load profiles',
            '24-7': '24/7 stations need reliable backup - fuel pumps require power to operate',
          },
        };

      case 'government':
        return {
          title: 'Government Building Details',
          icon: '🏛️',
          questions: [
            {
              id: 'buildingType',
              label: 'Building type?',
              type: 'select',
              options: [
                { value: 'city-hall', label: 'City Hall/Municipal Building' },
                { value: 'library', label: 'Public Library' },
                { value: 'police-fire', label: 'Police/Fire Station' },
                { value: 'public-works', label: 'Public Works Facility' },
                { value: 'community-center', label: 'Community Center' },
              ],
            },
            {
              id: 'buildingSize',
              label: 'Building size?',
              type: 'select',
              options: [
                { value: 'micro', label: 'Micro (< 5,000 sq ft)' },
                { value: 'small', label: 'Small (5,000-15,000 sq ft)' },
                { value: 'medium-small', label: 'Medium-Small (15,000-35,000 sq ft)' },
                { value: 'medium', label: 'Medium (35,000-75,000 sq ft)' },
                { value: 'large', label: 'Large (> 75,000 sq ft)' },
              ],
            },
            {
              id: 'gridConnection',
              label: 'Grid connection status?',
              type: 'select',
              options: [
                { value: 'on-grid', label: 'On-Grid (Utility connected)' },
                { value: 'hybrid', label: 'Hybrid (Grid + Backup Required)' },
              ],
            },
            {
              id: 'resilienceLevel',
              label: 'Resilience requirement?',
              type: 'select',
              options: [
                { value: 'critical', label: 'Critical (Police/Fire/Emergency Services)' },
                { value: 'important', label: 'Important (City Hall/Community Services)' },
                { value: 'standard', label: 'Standard (Library/Parks)' },
              ],
            },
            {
              id: 'operations',
              label: 'Operating hours?',
              type: 'select',
              options: [
                { value: '24-7', label: '24/7 Operations (Police/Fire)' },
                { value: 'extended', label: 'Extended Hours (6am-10pm)' },
                { value: 'business', label: 'Business Hours (8am-5pm)' },
              ],
            },
          ],
          insights: {
            'police-fire': 'Emergency services require instant backup power - battery systems provide <10ms switchover',
            'critical': 'Critical infrastructure often qualifies for grants and incentives for resilience projects',
            '24-7': '24/7 facilities benefit from demand charge reduction and backup power capabilities',
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
                { value: 'micro', label: 'Micro (< 10,000 sq ft)' },
                { value: 'small', label: 'Small (10,000-30,000 sq ft)' },
                { value: 'medium', label: 'Medium (30,000-100,000 sq ft)' },
                { value: 'large', label: 'Large (> 100,000 sq ft)' },
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
        const isSquareFootage = question.id === 'squareFootage';
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
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
              />
              {question.suffix && (
                <span className="text-gray-600 font-medium">{question.suffix}</span>
              )}
              {isSquareFootage && (
                <AISquareFootageCalculator
                  onCalculate={(sqft) => handleInputChange(question.id, sqft)}
                  industryType={selectedIndustry}
                />
              )}
            </div>
            {isSquareFootage && !value && (
              <p className="text-sm text-gray-500 mt-2">
                💡 Don't know your square footage? Use the AI calculator to estimate it!
              </p>
            )}
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
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
      {/* AI Helper Button - Centered at Top - Prominent positioning */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowAIHelper(!showAIHelper)}
          className="px-8 py-4 bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 z-10 transform hover:scale-105 animate-pulse"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4), 0 6px 12px rgba(0,0,0,0.15), inset 0 -3px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          <Bot className="w-6 h-6" />
          <span className="text-lg">AI Assistant - Get Help Here!</span>
          <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-ping"></span>
        </button>
      </div>

      {/* AI Helper Panel - Green theme */}
      {showAIHelper && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2">
                <span className="text-green-500">●</span> AI Assistant Available
              </h3>
              <p className="text-gray-700 mb-4">
                Need help answering these questions? I can help you:
              </p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Calculate square footage from building dimensions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Estimate peak electrical load from your utility bills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Suggest typical values for your industry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Answer questions about BESS sizing and configuration</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                💡 Tip: Look for the "AI Calculate" buttons next to specific fields, or ask me any question about your project!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          {/* Industry Image (if available) */}
          {getIndustryImage(selectedIndustry) && (
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white">
              <img 
                src={getIndustryImage(selectedIndustry)!} 
                alt={industryConfig.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Industry Icon */}
          <div className="text-6xl">{industryConfig.icon}</div>
        </div>
        <div className="flex justify-center items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-gray-900">
            {industryConfig.title}
          </h2>
          <AIStatusIndicator compact={true} />
        </div>
        <p className="text-gray-600 text-lg">
          Tell us about your operation to recommend the optimal system
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {industryConfig.questions
          .filter((question: any) => {
            // Handle conditional questions
            if (!question.conditional) return true;
            
            const { field, operator, value, dependsOn } = question.conditional;
            
            if (dependsOn) {
              // Legacy format: dependsOn field
              return useCaseData[dependsOn] === value;
            } else if (field && operator) {
              // New format: field with operator
              const fieldValue = useCaseData[field];
              
              switch (operator) {
                case '>':
                  return fieldValue > value;
                case '<':
                  return fieldValue < value;
                case '==':
                  return fieldValue === value;
                case '!=':
                  return fieldValue !== value;
                case '>=':
                  return fieldValue >= value;
                case '<=':
                  return fieldValue <= value;
                default:
                  return true;
              }
            }
            
            return true;
          })
          .map((question: any) => renderQuestion(question))
        }
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

              {/* Accept AI Configuration Button */}
              {aiConfig && setStorageSizeMW && setDurationHours && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Accept AI Configuration & Configure System
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm">Based on industry benchmarks and your specific use case</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && aiConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Accept AI Configuration?</h3>
              <p className="text-gray-600">This will automatically configure your energy storage system based on our AI analysis.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What This Does:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Sets your system size to <strong>{aiConfig.mw}MW</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Sets storage duration to <strong>{aiConfig.hours} hours</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Advances you to the <strong>Configuration page</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  You can still <strong>adjust the settings</strong> if needed
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptAIConfiguration}
                disabled={isApplyingAI}
                className={`flex-1 ${
                  isApplyingAI 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                } text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2`}
              >
                {isApplyingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Applying & Advancing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept & Configure
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2_UseCase;
