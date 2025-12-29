// ═══════════════════════════════════════════════════════════════════════════
// FACILITY DETAILS SECTION (Section 2)
// Extracted from StreamlinedWizard.tsx - Dec 2025 Refactor
// 
// Purpose: Handle industry-specific custom questions from database
// with fallback to facility size presets
// 
// Updated Dec 15, 2025: Added Facility Subtype + Equipment Tier selectors
// per Vineet feedback (Universal Pattern)
// Updated Dec 19, 2025: Added MERLIN GUIDANCE PANEL with recommendations
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  CheckCircle, 
  Gauge, 
  Info, 
  Minus, 
  Plus,
  Sparkles,
  Settings,
  Star,
  Lightbulb,
  MessageCircle,
  // Icons for amenities/options
  Waves,
  Dumbbell,
  Briefcase,
  ShoppingBag,
  Shirt,
  CircleDot,
  Utensils,
  Coffee,
  Wine,
  UtensilsCrossed,
  ChefHat,
  GlassWater,
  Users,
  Presentation,
  Building,
  Car,
  ParkingCircle,
  Sun,
  Zap,
  Battery,
  Plug,
  Target,
  Leaf,
  Award,
  Clock,
  TrendingDown,
  ShieldCheck,
  Banknote,
  CircleOff
} from 'lucide-react';
import { FACILITY_PRESETS, EQUIPMENT_TIER_OPTIONS, FACILITY_SUBTYPES } from '../constants/wizardConstants';
import type { WizardState, FacilityDetailsSectionProps, EquipmentTier } from '../types/wizardTypes';

// Import new high-fidelity UI components
import { StepExplanation, PrimaryButton, SecondaryButton } from '../ui';

// Import Merlin image
import merlinImage from '@/assets/images/new_profile_merlin.png';

// Step 2 colors - cool blue theme
import { getStepColors } from '../constants/stepColors';
const step2Colors = getStepColors(2);

// Icon mapping for common amenity/option values
const OPTION_ICONS: Record<string, React.ElementType> = {
  // Pool & Spa
  indoor_pool: Waves,
  outdoor_pool: Waves,
  pool_unheated: Waves,
  hot_tub: GlassWater,
  spa_full: Sparkles,
  spa: Sparkles,
  pool: Waves,
  // Fitness
  fitness_small: Dumbbell,
  fitness_large: Dumbbell,
  fitness: Dumbbell,
  // Business
  business_center: Briefcase,
  // Retail
  gift_shop: ShoppingBag,
  retail: ShoppingBag,
  // Laundry
  guest_laundry: Shirt,
  commercial_laundry: Shirt,
  laundry: Shirt,
  // Recreation
  tennis_courts: CircleDot,
  // F&B
  breakfast: Coffee,
  casual_dining: Utensils,
  fine_dining: UtensilsCrossed,
  bar_lounge: Wine,
  room_service: ChefHat,
  banquet: Users,
  coffee_shop: Coffee,
  pool_bar: GlassWater,
  restaurant: Utensils,
  // Meeting (compound values from DB)
  small: Users,
  medium: Presentation,
  large: Building,
  convention: Building,
  meeting_small: Users,
  meeting_medium: Presentation,
  ballroom: Building,
  // Parking (compound values from DB)
  surface: Car,
  structure: ParkingCircle,
  valet: Car,
  surface_lot: Car,
  parking_garage: ParkingCircle,
  // Solar (compound values from DB)
  operational: Sun,
  not_working: Sun,
  under_construction: Sun,
  approved: Sun,
  active: Sun,
  exploring: Sun,
  maybe_solar: Sun,
  solar_yes: Sun,
  solar_no: CircleOff,
  solar_construction: Sun,
  solar_permitted: Sun,
  // EV (compound values from DB)
  level2: Plug,
  dcfc: Zap,
  ultrafast: Battery,
  ev_level2: Plug,
  ev_dcfc: Zap,
  ev_ultrafast: Battery,
  ev_charging: Plug,
  high_priority: Zap,
  moderate: Plug,
  // Goals
  reduce_costs: Banknote,
  reduce_demand: TrendingDown,
  net_zero: Leaf,
  sustainability: Leaf,
  green_cert: Award,
  reduce_grid: ShieldCheck,
  demand_response: Clock,
  tou_optimization: Clock,
  // Generic
  none: CircleOff,
  no: CircleOff,
  yes: CheckCircle,
  sufficient: CheckCircle,
};

// Color mapping for option categories
const getOptionColor = (fieldName: string, isSelected: boolean) => {
  if (!isSelected) return { bg: 'bg-gray-50 hover:bg-gray-100', text: 'text-gray-600', icon: 'text-gray-400', border: 'border-gray-200' };
  
  // Map field names to color schemes
  if (fieldName.includes('amenities') || fieldName.includes('pool') || fieldName.includes('spa') || fieldName.includes('fitness')) {
    return { bg: 'bg-cyan-50', text: 'text-cyan-800', icon: 'text-cyan-500', border: 'border-cyan-300' };
  }
  if (fieldName.includes('food') || fieldName.includes('beverage') || fieldName.includes('fb') || fieldName.includes('dining')) {
    return { bg: 'bg-orange-50', text: 'text-orange-800', icon: 'text-orange-500', border: 'border-orange-300' };
  }
  if (fieldName.includes('meeting') || fieldName.includes('event') || fieldName.includes('conference')) {
    return { bg: 'bg-blue-50', text: 'text-blue-800', icon: 'text-blue-500', border: 'border-blue-300' };
  }
  if (fieldName.includes('parking')) {
    return { bg: 'bg-slate-100', text: 'text-slate-800', icon: 'text-slate-500', border: 'border-slate-300' };
  }
  if (fieldName.includes('solar')) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-500', border: 'border-amber-300' };
  }
  if (fieldName.includes('ev') || fieldName.includes('charger')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-500', border: 'border-emerald-300' };
  }
  if (fieldName.includes('goal') || fieldName.includes('priority')) {
    return { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-500', border: 'border-purple-300' };
  }
  if (fieldName.includes('backup') || fieldName.includes('outage')) {
    return { bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-500', border: 'border-red-300' };
  }
  // Default purple
  return { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-500', border: 'border-purple-300' };
};

export function FacilityDetailsSection({
  wizardState,
  setWizardState,
  currentSection,
  initializedFromVertical,
  sectionRef,
  onBack,
  onContinue,
}: FacilityDetailsSectionProps) {
  // Filter out redundant grid/utility questions that are handled in other sections
  const excludedFields = [
    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
    'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
    'wantsSolar', 'hasEVCharging', 'evChargerCount',
    // EV chargers - now handled in Section 5 with dedicated L1/L2/L3/DCFC/HPC UI
    'existingEVChargers', 'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
  ];
  const filteredQuestions = wizardState.customQuestions.filter(
    (q: any) => !excludedFields.includes(q.field_name)
  );

  // Auto-apply defaults for excluded required fields (so they don't block validation)
  React.useEffect(() => {
    const excludedRequiredWithDefaults = wizardState.customQuestions.filter(
      (q: any) => excludedFields.includes(q.field_name) && q.is_required && q.default_value
    );
    const updates: Record<string, any> = {};
    excludedRequiredWithDefaults.forEach((q: any) => {
      if (wizardState.useCaseData[q.field_name] === undefined) {
        updates[q.field_name] = q.default_value;
      }
    });
    if (Object.keys(updates).length > 0) {
      setWizardState(prev => ({
        ...prev,
        useCaseData: { ...prev.useCaseData, ...updates }
      }));
    }
  }, [wizardState.customQuestions]);

  // Check if all required VISIBLE questions are answered (exclude hidden fields from validation)
  // A question is valid if:
  // 1. It's not required, OR
  // 2. It has a user-entered value, OR
  // 3. It has a default value that was applied
  const isFormValid = filteredQuestions.length > 0 
    ? !filteredQuestions.some((q: any) => {
        if (!q.is_required) return false; // Not required = valid
        const value = wizardState.useCaseData[q.field_name];
        const hasValue = value !== undefined && value !== null && value !== '';
        const hasDefault = q.default_value !== undefined && q.default_value !== null && q.default_value !== '';
        return !hasValue && !hasDefault; // Invalid only if no value AND no default
      })
    : wizardState.facilitySize > 0;

  return (
    <div 
      ref={sectionRef}
      className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 2 ? 'hidden' : ''}`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Vertical Landing Page Welcome Banner */}
        {initializedFromVertical && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-700">Welcome from {wizardState.industryName}!</h4>
                <p className="text-sm text-emerald-600">
                  We've imported your info. Let's confirm a few details to build your custom quote.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Section Navigation - Hide "Back" for vertical users on first visit */}
        <div className="flex items-center justify-between mb-6">
          {!initializedFromVertical ? (
            <SecondaryButton
              onClick={onBack}
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
              className="w-auto"
            >
              Back to Industry
            </SecondaryButton>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600">
              <Sparkles className="w-4 h-4" />
              <span>Pre-filled from your calculator</span>
            </div>
          )}
          <div className="text-sm text-gray-400">
            {initializedFromVertical ? 'Step 1 of 5' : 'Step 3 of 5'}
          </div>
        </div>
        
        {/* Step Explanation - High fidelity header */}
        <StepExplanation
          stepNumber={initializedFromVertical ? 1 : 2}
          totalSteps={initializedFromVertical ? 4 : 5}
          title={initializedFromVertical 
            ? `Confirm Your ${wizardState.industryName || 'Facility'} Details`
            : `Tell Us About Your ${wizardState.industryName || 'Facility'}`
          }
          description={initializedFromVertical 
            ? "We've pre-filled some values based on your calculator inputs. Review and adjust as needed, then continue to configure your energy system."
            : "Answer a few industry-specific questions to help Merlin accurately size your battery storage system and maximize your savings."
          }
          estimatedTime="2 minutes"
        />
        
        {/* Progress badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">{wizardState.state}</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-4 py-1.5">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 text-sm">{wizardState.industryName}</span>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            🧙‍♂️ MERLIN'S GUIDANCE PANEL - Dec 19, 2025
            Shows Merlin guiding the user with recommendations
            ═══════════════════════════════════════════════════════════════════ */}
        {(() => {
          // Industry-specific guidance and preliminary estimates
          const industryGuidance: Record<string, { 
            greeting: string;
            whatToDo: string;
            whyItMatters: string;
            typicalPeakKW: string;
            typicalBESSKWh: string;
            equipmentRec: 'standard' | 'premium';
            equipmentWhy: string;
          }> = {
            'shopping-center': {
              greeting: "Great choice! Shopping centers are perfect for BESS because of your high daytime demand charges.",
              whatToDo: "Tell me about your anchor tenants, common areas, and peak shopping times. I'll use this to calculate your exact power needs.",
              whyItMatters: "Your HVAC and lighting during peak retail hours drive most of your electricity costs. We can shave 20-40% off demand charges.",
              typicalPeakKW: "500 - 2,000 kW",
              typicalBESSKWh: "1,000 - 4,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment handles most shopping centers well. Upgrade to Premium only if you have 24/7 grocery anchors or data centers."
            },
            'hotel': {
              greeting: "Hotels are excellent BESS candidates! Your consistent occupancy patterns make savings very predictable.",
              whatToDo: "Tell me about your rooms, amenities (pool, restaurant, spa), and typical occupancy. This helps me size your system perfectly.",
              whyItMatters: "Hotels have predictable demand peaks around check-in time and evening hours. BESS can shave these peaks dramatically.",
              typicalPeakKW: "200 - 800 kW",
              typicalBESSKWh: "400 - 1,600 kWh",
              equipmentRec: 'premium',
              equipmentWhy: "I recommend Premium for hotels - your guests expect 24/7 reliability, and the efficiency gains pay off with your continuous operation."
            },
            'hospital': {
              greeting: "Critical infrastructure! Hospitals need the most reliable energy systems. Let me design something bulletproof.",
              whatToDo: "I need to know your bed count, critical care units, and backup requirements. These determine minimum BESS sizing for safety.",
              whyItMatters: "Hospitals can't afford any downtime. Your BESS will provide instant backup AND ongoing demand charge savings.",
              typicalPeakKW: "1,000 - 5,000 kW",
              typicalBESSKWh: "2,000 - 10,000 kWh",
              equipmentRec: 'premium',
              equipmentWhy: "Premium is essential for hospitals. You need the highest reliability, redundancy, and fastest response times for critical care."
            },
            'data-center': {
              greeting: "Data centers are ideal for BESS - your load is constant, predictable, and reliability is paramount.",
              whatToDo: "Tell me your IT load in kW, cooling system type, and redundancy requirements (N+1, 2N). I'll design for 99.999% uptime.",
              whyItMatters: "Even seconds of downtime cost fortune in data centers. BESS provides instant switchover plus ongoing energy arbitrage.",
              typicalPeakKW: "500 - 10,000 kW",
              typicalBESSKWh: "1,000 - 20,000 kWh",
              equipmentRec: 'premium',
              equipmentWhy: "Premium is mandatory for data centers. Tier III/IV requirements demand the highest quality equipment with full redundancy."
            },
            'manufacturing': {
              greeting: "Manufacturing plants see huge savings from BESS - your demand spikes from equipment startups are expensive!",
              whatToDo: "Share your production schedule, major equipment loads, and shift patterns. This reveals your peak shaving opportunity.",
              whyItMatters: "Motor startups and production ramps create expensive demand spikes. BESS smooths these out for major savings.",
              typicalPeakKW: "500 - 5,000 kW",
              typicalBESSKWh: "1,000 - 10,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment works great for most manufacturing. Consider Premium only for 24/7 operations or harsh environments."
            },
            'warehouse': {
              greeting: "Warehouses have surprisingly good BESS economics - especially with refrigeration or forklift charging!",
              whatToDo: "Tell me about your square footage, refrigeration needs, and forklift charging schedules. These are your main power drivers.",
              whyItMatters: "Cold storage and EV forklift charging create predictable demand peaks. BESS can reduce your utility bills 15-30%.",
              typicalPeakKW: "150 - 1,000 kW",
              typicalBESSKWh: "300 - 2,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment is perfect for warehouse applications. Simple, reliable, cost-effective."
            },
            'retail': {
              greeting: "Retail stores benefit nicely from BESS - your daytime hours align perfectly with peak utility rates!",
              whatToDo: "Tell me your store size, operating hours, and major equipment (refrigeration, HVAC). I'll size for maximum ROI.",
              whyItMatters: "Retail's daytime operation coincides with highest utility rates. BESS lets you buy cheap nighttime power and use it during the day.",
              typicalPeakKW: "50 - 300 kW",
              typicalBESSKWh: "100 - 600 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment is ideal for retail. Clean, quiet, compact units that won't disturb your customers."
            },
            'office': {
              greeting: "Office buildings are BESS sweet spots! Your 9-5 demand profile is perfect for peak shaving.",
              whatToDo: "Share your square footage, floor count, and tenant types. Also let me know about your data center or server rooms if any.",
              whyItMatters: "Office HVAC peaks during afternoon hours when rates are highest. BESS reduces these peaks by 20-40%.",
              typicalPeakKW: "200 - 2,000 kW",
              typicalBESSKWh: "400 - 4,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment handles most office buildings excellently. Upgrade to Premium for Class A buildings with 24/7 tenants."
            },
            'car-wash': {
              greeting: "Car washes are unique - your power spikes during washes are perfect for BESS optimization!",
              whatToDo: "Tell me about your bay count, wash types, and daily vehicle throughput. Each wash creates a demand spike I can smooth out.",
              whyItMatters: "Car wash motors and blowers create huge but brief demand spikes. BESS eliminates demand charges from these spikes.",
              typicalPeakKW: "100 - 500 kW",
              typicalBESSKWh: "200 - 1,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "Standard equipment is perfect for car washes. Handles the rapid charge/discharge cycles well."
            },
            'ev-charging': {
              greeting: "EV charging stations are the future of energy! Let me design a BESS that maximizes your charging profits.",
              whatToDo: "Tell me your charger count by type (Level 2, DCFC, HPC), daily sessions, and grid connection capacity.",
              whyItMatters: "Without BESS, DCFC chargers create massive demand charges. BESS can cut your utility costs 40-60%!",
              typicalPeakKW: "100 - 1,000 kW",
              typicalBESSKWh: "200 - 2,000 kWh",
              equipmentRec: 'premium',
              equipmentWhy: "Premium is recommended for EV charging - high cycle counts and fast charge/discharge require quality cells."
            },
            'default': {
              greeting: "Let me analyze your facility to find the best energy storage solution for your specific needs.",
              whatToDo: "Answer the questions below about your facility. The more details you provide, the more accurate my recommendations will be.",
              whyItMatters: "Every facility is unique. Your answers help me calculate exactly how much you can save with battery storage.",
              typicalPeakKW: "100 - 1,000 kW",
              typicalBESSKWh: "200 - 2,000 kWh",
              equipmentRec: 'standard',
              equipmentWhy: "I'll recommend the right equipment tier based on your specific requirements."
            }
          };
          
          const guidance = industryGuidance[wizardState.selectedIndustry] || industryGuidance['default'];
          
          return (
            <div className="bg-gradient-to-br from-[#1a1f4e] via-[#252a6a] to-[#1a1f4e] rounded-3xl p-6 border-2 border-[#4b59f5]/50 shadow-2xl mb-6 relative overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7DD3FC]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
              
              {/* Merlin Header */}
              <div className="flex items-start gap-4 mb-5 relative z-10">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#7DD3FC]/50 bg-gradient-to-br from-[#060F76] to-[#1a237e] shadow-lg">
                  <img src={merlinImage} alt="Merlin" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">Merlin's Guidance</h3>
                    <Sparkles className="w-5 h-5 text-[#7DD3FC]" />
                  </div>
                  <p className="text-[#7DD3FC] text-lg leading-relaxed">
                    {guidance.greeting}
                  </p>
                </div>
              </div>
              
              {/* What To Do - CLEAR GUIDANCE */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/20 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
                      <span>What I Need From You</span>
                      <ArrowRight className="w-4 h-4" />
                    </h4>
                    <p className="text-white/90">{guidance.whatToDo}</p>
                  </div>
                </div>
              </div>
              
              {/* Why It Matters */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-bold mb-1">Why This Matters</h4>
                    <p className="text-white/80">{guidance.whyItMatters}</p>
                  </div>
                </div>
              </div>
              
              {/* Preliminary Estimates */}
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-400/30">
                  <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
                    <Zap className="w-4 h-4" />
                    <span>Typical Peak Demand</span>
                  </div>
                  <div className="text-white font-bold text-lg">{guidance.typicalPeakKW}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm mb-1">
                    <Battery className="w-4 h-4" />
                    <span>Typical BESS Size</span>
                  </div>
                  <div className="text-white font-bold text-lg">{guidance.typicalBESSKWh}</div>
                </div>
              </div>
              
              {/* Equipment Recommendation */}
              <div className={`relative z-10 rounded-xl p-4 border ${
                guidance.equipmentRec === 'premium' 
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-400/30'
                  : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border-blue-400/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    guidance.equipmentRec === 'premium' ? 'bg-amber-500/30' : 'bg-blue-500/30'
                  }`}>
                    {guidance.equipmentRec === 'premium' ? (
                      <Star className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Settings className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-bold mb-1 flex items-center gap-2 ${
                      guidance.equipmentRec === 'premium' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      <span>My Recommendation: {guidance.equipmentRec === 'premium' ? 'Premium' : 'Standard'} Equipment</span>
                    </h4>
                    <p className="text-white/80 text-sm">{guidance.equipmentWhy}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* ═══════════════════════════════════════════════════════════════════
            FACILITY SUBTYPE SELECTOR (Dec 2025 - Universal Pattern)
            First question for all use cases - determines power profile
            ═══════════════════════════════════════════════════════════════════ */}
        {(() => {
          const subtypes = FACILITY_SUBTYPES[wizardState.selectedIndustry] || FACILITY_SUBTYPES['default'];
          // Only show if there are meaningful subtypes (more than just "standard")
          if (subtypes.length <= 1 && subtypes[0]?.id === 'standard') return null;
          
          return (
            <div className={`${step2Colors.panelBgGradient} rounded-3xl p-6 border-2 ${step2Colors.panelBorder} shadow-xl mb-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#004499] rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0066CC]">What type of {wizardState.industryName || 'facility'}?</h3>
                  <p className="text-sm text-gray-500">This affects power requirements and sizing</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subtypes.map((subtype) => (
                  <button
                    key={subtype.id}
                    onClick={() => setWizardState(prev => ({ ...prev, facilitySubtype: subtype.id }))}
                    className={`p-4 rounded-xl text-left transition-all ${
                      wizardState.facilitySubtype === subtype.id
                        ? 'bg-gradient-to-br from-[#0066CC] to-[#004499] text-white shadow-lg shadow-blue-500/30'
                        : 'bg-blue-50/50 border-2 border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-100'
                    }`}
                  >
                    <div className="font-bold">{subtype.label}</div>
                    <div className={`text-sm mt-1 ${wizardState.facilitySubtype === subtype.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {subtype.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
        
        {/* ═══════════════════════════════════════════════════════════════════
            EQUIPMENT TIER SELECTOR (Dec 2025 - Simplified Two-Tier System)
            Standard vs Premium - per Vineet feedback
            ═══════════════════════════════════════════════════════════════════ */}
        <div className={`${step2Colors.panelBgGradient} rounded-3xl p-6 border-2 ${step2Colors.panelBorder} shadow-xl mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#004499] rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0066CC]">Equipment Grade</h3>
              <p className="text-sm text-gray-500">Standard meets needs; Premium maximizes efficiency</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {EQUIPMENT_TIER_OPTIONS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setWizardState(prev => ({ ...prev, equipmentTier: tier.id as EquipmentTier }))}
                className={`p-5 rounded-xl text-left transition-all relative overflow-hidden ${
                  wizardState.equipmentTier === tier.id
                    ? tier.id === 'premium'
                      ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gradient-to-br from-[#0066CC] to-[#004499] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-blue-50/30 border-2 border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {tier.id === 'premium' && wizardState.equipmentTier !== 'premium' && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="font-bold">{tier.label}</div>
                </div>
                <div className={`text-sm mt-2 ${wizardState.equipmentTier === tier.id ? 'text-white/90' : 'text-gray-500'}`}>
                  {tier.description}
                </div>
                {tier.id === 'premium' && (
                  <div className={`text-xs mt-2 font-medium ${wizardState.equipmentTier === tier.id ? 'text-white/80' : 'text-amber-600'}`}>
                    +30% capacity, +25% cost
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dynamic Custom Questions from Database */}
        <div className={`${step2Colors.panelBgGradient} rounded-3xl p-8 border-2 ${step2Colors.panelBorder} shadow-xl`}>
          {filteredQuestions.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#004499] rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0066CC]">Industry-Specific Details</h3>
                  <p className="text-sm text-gray-500">{filteredQuestions.length} questions to accurately size your system</p>
                </div>
              </div>
              
              {/* Render each custom question dynamically */}
              <div className="space-y-8">
                {filteredQuestions.map((question: any, index: number) => {
                  // Special styling for primaryBESSApplication
                  const isBESSQuestion = question.field_name === 'primaryBESSApplication';
                  
                  // Special styling for energy goals
                  const isGoalsQuestion = question.field_name === 'energyGoals' || question.field_name.includes('goal');
                  
                  return (
                  <div key={question.field_name} className={`rounded-2xl p-6 border-2 ${
                    isBESSQuestion 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
                      : isGoalsQuestion
                        ? 'bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 border-purple-300'
                        : `${step2Colors.panelBg} border-blue-200`
                  }`}>
                    {/* Special BESS explanation banner */}
                    {isBESSQuestion && (
                      <div className="mb-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-800 font-medium">💡 What is BESS?</p>
                        <p className="text-xs text-emerald-700 mt-1">
                          <strong>Battery Energy Storage Systems (BESS)</strong> store electricity to use later—helping you cut costs, avoid outages, and maximize renewable energy. Choose your primary application below.
                        </p>
                      </div>
                    )}
                    
                    <label className={`block font-bold mb-2 ${
                      isBESSQuestion 
                        ? 'text-emerald-800 text-xl' 
                        : isGoalsQuestion
                          ? 'text-purple-800 text-xl'
                          : 'text-[#0066CC] text-lg'
                    }`}>
                      {question.question_text}
                      {question.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.help_text && (
                      <p className={`text-base mb-4 ${
                        isBESSQuestion 
                          ? 'text-emerald-600' 
                          : isGoalsQuestion
                            ? 'text-purple-600'
                            : 'text-blue-600/70'
                      }`}>{question.help_text}</p>
                    )}
                    
                    {/* Number input */}
                    {question.question_type === 'number' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                            const step = question.max_value > 100 ? 10 : 1;
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: Math.max(question.min_value || 0, currentVal - step)
                              }
                            }));
                          }}
                          className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
                        >
                          <Minus className="w-5 h-5 text-[#0066CC]" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: parseFloat(val) || 0
                              }
                            }));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-5 py-4 bg-white border-2 border-blue-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-[#0066CC] focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                          onClick={() => {
                            const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                            const step = question.max_value > 100 ? 10 : 1;
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: Math.min(question.max_value || 999999, currentVal + step)
                              }
                            }));
                          }}
                          className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-[#0066CC]" />
                        </button>
                      </div>
                    )}
                    
                    {/* Select input - Merlin gradient styling */}
                    {question.question_type === 'select' && question.options && (() => {
                      const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]');
                      
                      // Use dropdown for selects with more than 6 options (increased threshold)
                      if (options.length > 6 && !isBESSQuestion) {
                        return (
                          <select
                            value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                            onChange={(e) => setWizardState(prev => ({
                              ...prev,
                              useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                            }))}
                            className="w-full px-5 py-4 bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl text-gray-800 text-lg font-semibold focus:border-[#0066CC] focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230066CC%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                          >
                            <option value="" disabled>Select an option...</option>
                            {options.map((option: any) => {
                              const optionValue = typeof option === 'string' ? option : option.value;
                              const optionLabel = typeof option === 'string' ? option : option.label;
                              return (
                                <option key={optionValue} value={optionValue}>{optionLabel}</option>
                              );
                            })}
                          </select>
                        );
                      }
                      
                      // Use large card buttons for 6 or fewer options
                      // Gradient colors cycle: blue→sky→cyan→teal→emerald→green (cool blue theme)
                      const gradients = [
                        { selected: 'from-[#0066CC] to-[#004499]', border: 'border-blue-300 hover:border-blue-400', bg: 'from-blue-50 to-sky-50', shadow: 'shadow-blue-500/20' },
                        { selected: 'from-sky-500 to-cyan-600', border: 'border-sky-300 hover:border-sky-400', bg: 'from-sky-50 to-cyan-50', shadow: 'shadow-sky-500/20' },
                        { selected: 'from-cyan-500 to-teal-600', border: 'border-cyan-300 hover:border-cyan-400', bg: 'from-cyan-50 to-teal-50', shadow: 'shadow-cyan-500/20' },
                        { selected: 'from-teal-500 to-emerald-600', border: 'border-teal-300 hover:border-teal-400', bg: 'from-teal-50 to-emerald-50', shadow: 'shadow-teal-500/20' },
                        { selected: 'from-emerald-500 to-green-600', border: 'border-emerald-300 hover:border-emerald-400', bg: 'from-emerald-50 to-green-50', shadow: 'shadow-emerald-500/20' },
                        { selected: 'from-green-500 to-teal-500', border: 'border-green-300 hover:border-green-400', bg: 'from-green-50 to-teal-50', shadow: 'shadow-green-500/20' },
                      ];
                      
                      return (
                        <div className={`grid gap-4 ${
                          isBESSQuestion 
                            ? 'grid-cols-1 md:grid-cols-2' 
                            : options.length <= 3 
                              ? 'grid-cols-1 sm:grid-cols-3' 
                              : options.length <= 5
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                          {options.map((option: any, optIdx: number) => {
                            const optionValue = typeof option === 'string' ? option : option.value;
                            const optionLabel = typeof option === 'string' ? option : option.label;
                            const isSelected = wizardState.useCaseData[question.field_name] === optionValue;
                            const gradient = gradients[optIdx % gradients.length];
                            
                            return (
                              <button
                                key={optionValue}
                                onClick={() => setWizardState(prev => ({
                                  ...prev,
                                  useCaseData: { ...prev.useCaseData, [question.field_name]: optionValue }
                                }))}
                                className={`group py-4 px-5 rounded-2xl font-semibold text-base transition-all duration-200 text-left border-2 ${
                                  isBESSQuestion
                                    ? isSelected
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 border-emerald-400 scale-[1.02]'
                                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-gray-700 hover:border-emerald-400 hover:shadow-md'
                                    : isSelected
                                      ? `bg-gradient-to-r ${gradient.selected} text-white shadow-lg ${gradient.shadow} border-transparent scale-[1.02]`
                                      : `bg-gradient-to-r ${gradient.bg} ${gradient.border} text-gray-700 hover:shadow-md`
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  {isSelected && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                                  <span className="leading-tight">{optionLabel}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    
                    {/* Text input */}
                    {question.question_type === 'text' && (
                      <input
                        type="text"
                        value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                        onChange={(e) => setWizardState(prev => ({
                          ...prev,
                          useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                        }))}
                        placeholder={question.placeholder || ''}
                        className="w-full px-5 py-4 bg-white border-2 border-blue-200 rounded-xl text-gray-800 focus:border-[#0066CC] focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    )}
                    
                    {/* Boolean input */}
                    {question.question_type === 'boolean' && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardState.useCaseData[question.field_name] === true || wizardState.useCaseData[question.field_name] === 'true'}
                          onChange={(e) => setWizardState(prev => ({
                            ...prev,
                            useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.checked }
                          }))}
                          className="w-6 h-6 rounded accent-[#0066CC]"
                        />
                        <span className="text-gray-700">Yes</span>
                      </label>
                    )}
                    
                    {/* Slider input (Dec 2025) - for elevator count, bill estimates */}
                    {question.question_type === 'slider' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={question.min_value || 0}
                            max={question.max_value || 100}
                            step={question.step_value || 1}
                            value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0}
                            onChange={(e) => setWizardState(prev => ({
                              ...prev,
                              useCaseData: { ...prev.useCaseData, [question.field_name]: parseFloat(e.target.value) }
                            }))}
                            className="flex-1 h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-[#0066CC]"
                          />
                          <div className="bg-blue-100 rounded-xl px-4 py-2 min-w-[100px] text-center border-2 border-blue-300">
                            <span className="text-2xl font-black text-[#0066CC]">
                              {question.field_name.includes('bill') || question.field_name.includes('cost') 
                                ? `$${(wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0).toLocaleString()}`
                                : (wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0).toLocaleString()
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span>{question.min_value || 0}{question.field_name.includes('bill') || question.field_name.includes('cost') ? '' : ''}</span>
                          <span>{question.max_value || 100}{question.field_name.includes('bill') || question.field_name.includes('cost') ? '' : ''}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        MULTISELECT INPUT (Dec 2025) - Enhanced with icons & colors
                        Uses large card-style checkboxes with category-specific colors
                        Stores selected values as JSON array in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {(question.question_type === 'multiselect' || question.question_type === 'multi-select') && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option: any) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          const optionPower = typeof option === 'object' ? option.powerKw : null;
                          
                          // Get current selections as array
                          const currentSelections: string[] = Array.isArray(wizardState.useCaseData[question.field_name])
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : []);
                          const isSelected = currentSelections.includes(optionValue);
                          
                          // Get icon and colors
                          const IconComponent = OPTION_ICONS[optionValue] || (optionValue.includes('none') || optionValue.includes('no_') ? CircleOff : CheckCircle);
                          const colors = getOptionColor(question.field_name, isSelected);
                          
                          return (
                            <label
                              key={optionValue}
                              className={`group flex items-center gap-4 cursor-pointer p-5 rounded-2xl transition-all duration-200 border-2 ${
                                isSelected
                                  ? `${colors.bg} ${colors.border} shadow-lg shadow-${colors.border.split('-')[1]}-500/20 scale-[1.02]`
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                              }`}
                            >
                              {/* Custom large checkbox */}
                              <div className={`relative flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                                isSelected 
                                  ? `${colors.border} ${colors.bg}` 
                                  : 'border-gray-300 bg-white group-hover:border-gray-400'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                                )}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSelections = e.target.checked
                                      ? [...currentSelections, optionValue]
                                      : currentSelections.filter(v => v !== optionValue);
                                    setWizardState(prev => ({
                                      ...prev,
                                      useCaseData: { ...prev.useCaseData, [question.field_name]: newSelections }
                                    }));
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                              
                              {/* Icon - larger and more prominent */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                isSelected ? `${colors.bg} ring-2 ring-offset-2 ring-${colors.border.split('-')[1]}-300` : 'bg-gray-100 group-hover:bg-gray-200'
                              }`}>
                                <IconComponent className={`w-6 h-6 ${isSelected ? colors.icon : 'text-gray-400 group-hover:text-gray-500'}`} />
                              </div>
                              
                              {/* Label and power - larger fonts */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-base font-semibold leading-tight ${isSelected ? colors.text : 'text-gray-700 group-hover:text-gray-900'}`}>
                                  {optionLabel}
                                </p>
                                {optionPower !== null && optionPower !== undefined && (
                                  <p className={`text-sm font-medium mt-1 ${isSelected ? colors.icon : 'text-gray-400'}`}>
                                    {optionPower > 0 ? `+${optionPower} kW` : optionPower === 0 ? '0 kW' : `${optionPower} kW`}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        COMPOUND INPUT (Dec 2025) - Compact checklist with inline amounts
                        Renders nested questions (e.g., F&B with seat counts, EV with charger counts)
                        Each sub-question has enable checkbox + optional numeric input
                        Stores as JSON object in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {question.question_type === 'compound' && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((subQ: any) => {
                          // Get current compound state as object
                          const compoundData: Record<string, any> = typeof wizardState.useCaseData[question.field_name] === 'object'
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : {});
                          
                          const subValue = subQ.value;
                          const isEnabled = compoundData[subValue]?.enabled ?? false;
                          const subAmount = compoundData[subValue]?.amount ?? (subQ.defaultAmount || 0);
                          
                          // Get icon for this option
                          const IconComponent = OPTION_ICONS[subValue] || (subValue.includes('none') || subValue.includes('no') ? CircleOff : CheckCircle);
                          const colors = getOptionColor(question.field_name, isEnabled);
                          
                          return (
                            <label 
                              key={subValue}
                              className={`group flex flex-col cursor-pointer p-5 rounded-2xl transition-all duration-200 border-2 ${
                                isEnabled 
                                  ? `${colors.bg} ${colors.border} shadow-lg scale-[1.02]`
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Custom large checkbox */}
                                <div className={`relative flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                                  isEnabled 
                                    ? `${colors.border} ${colors.bg}` 
                                    : 'border-gray-300 bg-white group-hover:border-gray-400'
                                }`}>
                                  {isEnabled && (
                                    <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const newCompound = {
                                        ...compoundData,
                                        [subValue]: { 
                                          enabled: e.target.checked, 
                                          amount: subAmount 
                                        }
                                      };
                                      setWizardState(prev => ({
                                        ...prev,
                                        useCaseData: { ...prev.useCaseData, [question.field_name]: newCompound }
                                      }));
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </div>
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  isEnabled ? `${colors.bg} ring-2 ring-offset-2` : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                  <IconComponent className={`w-6 h-6 ${isEnabled ? colors.icon : 'text-gray-400 group-hover:text-gray-500'}`} />
                                </div>
                                
                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-base font-semibold leading-tight ${isEnabled ? colors.text : 'text-gray-700 group-hover:text-gray-900'}`}>
                                    {subQ.label}
                                  </p>
                                  {subQ.powerKw > 0 && (
                                    <p className={`text-sm font-medium mt-1 ${isEnabled ? colors.icon : 'text-gray-400'}`}>
                                      +{subQ.powerKw} kW
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Inline numeric input for sub-question - expanded */}
                              {isEnabled && subQ.hasAmount && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                                  <span className="text-sm text-gray-600 font-medium">Amount:</span>
                                  <input
                                    type="number"
                                    min={subQ.minAmount || 0}
                                    max={subQ.maxAmount || 9999}
                                    value={subAmount}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const newCompound = {
                                        ...compoundData,
                                        [subValue]: { 
                                          enabled: true, 
                                          amount: parseInt(e.target.value) || 0 
                                        }
                                      };
                                      setWizardState(prev => ({
                                        ...prev,
                                        useCaseData: { ...prev.useCaseData, [question.field_name]: newCompound }
                                      }));
                                    }}
                                    className={`flex-1 px-4 py-2 ${colors.bg} border-2 ${colors.border} rounded-xl text-center text-lg font-bold ${colors.text} focus:ring-2 focus:ring-offset-1`}
                                  />
                                  <span className={`text-sm font-medium ${colors.text} min-w-[60px]`}>{subQ.amountUnit || ''}</span>
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Fallback to facility size presets if no custom questions */
            <>
              {(() => {
                const preset = FACILITY_PRESETS[wizardState.selectedIndustry] || FACILITY_PRESETS.default;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#004499] rounded-2xl flex items-center justify-center">
                        <Gauge className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0066CC]">{preset.label}</h3>
                        <p className="text-sm text-gray-500">Select or enter your size in {preset.unit}</p>
                      </div>
                    </div>
                    
                    {/* Preset buttons */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {preset.presets.map((size) => (
                        <button
                          key={size}
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: size }))}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            wizardState.facilitySize === size
                              ? 'bg-[#0066CC] text-white shadow-lg shadow-blue-500/30'
                              : 'bg-blue-100 text-[#0066CC] hover:bg-blue-200'
                          }`}
                        >
                          {size.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom input */}
                    <div className="mb-8">
                      <label className="block text-sm text-gray-500 mb-2">Or enter custom value:</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: Math.max(1000, prev.facilitySize - 5000) }))}
                          className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
                        >
                          <Minus className="w-5 h-5 text-[#0066CC]" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={wizardState.facilitySize || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setWizardState(prev => ({ ...prev, facilitySize: parseInt(val) || 0 }));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-5 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-[#0066CC] focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: prev.facilitySize + 5000 }))}
                          className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-[#0066CC]" />
                        </button>
                      </div>
                      <p className="text-center text-gray-500 mt-2">{preset.unit}</p>
                    </div>
                  </>
                );
              })()}
            </>
          )}
          
          {/* Continue button */}
          <PrimaryButton
            onClick={onContinue}
            disabled={!isFormValid}
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            className="mt-6"
          >
            Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
