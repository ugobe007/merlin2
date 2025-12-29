/**
 * STEP 3: FACILITY DETAILS - NEW DESIGN (Performance Optimized)
 * =============================================================
 * 
 * Based on HTML design provided - Dec 2025
 * 
 * Features:
 * - Top header with power stats
 * - Sidebar navigation
 * - Expandable amenity categories with pills
 * - Yes/No questions
 * - Instant UI updates (local state only)
 * - Calculations only on "Next Step" click
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import merlinProfile from '@/assets/images/new_profile_merlin.png';

interface Step3FacilityDetailsV3Props {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  onBack: () => void;
  onHome?: () => void;
  onContinue: () => void;
  sectionRef?: React.RefObject<HTMLDivElement> | ((el: HTMLDivElement | null) => void);
  isHidden?: boolean;
}

// Amenity categories matching HTML design
type AmenityCategory = 
  | {
      id: string;
      icon: string;
      label: string;
      pills: Array<{ id: string; icon: string; label: string }>;
      hasExpanded?: boolean;
      isYesNo?: never;
      questions?: never;
    }
  | {
      id: string;
      icon: string;
      label: string;
      isYesNo: true;
      questions: Array<{ id: string; label: string }>;
      pills?: never;
      hasExpanded?: never;
    };

const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    id: 'pool',
    icon: '🏊',
    label: 'Pool & Aquatics',
    pills: [
      { id: 'indoor_pool', icon: '🏊', label: 'Indoor Pool' },
      { id: 'outdoor_pool', icon: '🏊', label: 'Outdoor Pool' },
      { id: 'hot_tub', icon: '♨️', label: 'Hot Tub / Jacuzzi' },
      { id: 'water_park', icon: '🌊', label: 'Water Park' },
    ],
  },
  {
    id: 'wellness',
    icon: '💪',
    label: 'Wellness & Fitness',
    pills: [
      { id: 'fitness_center', icon: '🏋️', label: 'Fitness Center' },
      { id: 'spa', icon: '💆', label: 'Full Spa' },
      { id: 'sauna', icon: '🧖', label: 'Sauna / Steam' },
      { id: 'golf', icon: '⛳', label: 'Golf Course' },
    ],
  },
  {
    id: 'food',
    icon: '🍽️',
    label: 'Food & Beverage',
    pills: [
      { id: 'restaurant', icon: '🍽️', label: 'Restaurant(s)' },
      { id: 'bar', icon: '🍸', label: 'Bar / Lounge' },
      { id: 'room_service', icon: '🛎️', label: 'Room Service' },
      { id: 'banquet', icon: '🎉', label: 'Banquet Facilities' },
    ],
  },
  {
    id: 'business',
    icon: '💼',
    label: 'Business & Events',
    pills: [
      { id: 'meeting_rooms', icon: '👥', label: 'Meeting Rooms' },
      { id: 'conference_center', icon: '🏛️', label: 'Conference Center' },
      { id: 'ballroom', icon: '💃', label: 'Ballroom' },
      { id: 'business_center', icon: '💻', label: 'Business Center' },
    ],
  },
  {
    id: 'services',
    icon: '⭐',
    label: 'Guest Services',
    pills: [
      { id: 'laundry', icon: '👕', label: 'On-Site Laundry' },
      { id: 'ev_charging', icon: '🔌', label: 'EV Charging' },
      { id: 'parking', icon: '🅿️', label: 'Parking Garage' },
      { id: 'existing_solar', icon: '☀️', label: 'Existing Solar' },
    ],
    hasExpanded: true, // EV Charging has expanded content
  },
  {
    id: 'power',
    icon: '🔋',
    label: 'Critical Power Needs',
    isYesNo: true, // This category uses Yes/No buttons instead of pills
    questions: [
      { id: 'backup_power', label: 'Do you need backup power for critical loads?' },
      { id: 'data_center', label: 'Do you have a data center or server room?' },
    ],
  },
];

export function Step3FacilityDetailsV3({
  wizardState,
  setWizardState,
  onBack,
  onHome,
  onContinue,
  sectionRef,
  isHidden = false,
}: Step3FacilityDetailsV3Props) {
  
  // ============================================
  // LOCAL STATE - INSTANT UI UPDATES (NO CALC)
  // ============================================
  
  const [roomCount, setRoomCount] = useState<number>(
    wizardState.useCaseData?.roomCount || wizardState.facilitySize || 0
  );
  const [squareFeet, setSquareFeet] = useState<number>(
    wizardState.useCaseData?.squareFootage || wizardState.useCaseData?.squareFeet || 0
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    wizardState.useCaseData?.selectedAmenities || []
  );
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean | null>>({
    backup_power: wizardState.useCaseData?.backup_power ?? null,
    data_center: wizardState.useCaseData?.data_center ?? null,
  });
  const [evL2Chargers, setEvL2Chargers] = useState<number>(
    wizardState.useCaseData?.evL2Chargers || wizardState.evChargersL2 || 0
  );
  const [evDCFastChargers, setEvDCFastChargers] = useState<number>(
    wizardState.useCaseData?.evDCFastChargers || wizardState.evChargersDCFC || 0
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['business']) // Business category expanded by default (per HTML)
  );
  
  // ============================================
  // HANDLERS - INSTANT (NO RECALC)
  // ============================================
  
  const handleRoomCountChange = useCallback((value: number) => {
    setRoomCount(value);
    if (import.meta.env.DEV) console.log('✅ [Step3] Room count changed - NO RECALC', value);
  }, []);
  
  const handleSquareFeetChange = useCallback((value: number) => {
    setSquareFeet(value);
    if (import.meta.env.DEV) console.log('✅ [Step3] Square feet changed - NO RECALC', value);
  }, []);
  
  const handleAmenityToggle = useCallback((amenityId: string) => {
    setSelectedAmenities(prev => {
      const newAmenities = prev.includes(amenityId)
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId];
      
      if (import.meta.env.DEV) console.log('✅ [Step3] Amenity toggled - NO RECALC', amenityId);
      
      return newAmenities;
    });
  }, []);
  
  const handleYesNoAnswer = useCallback((questionId: string, value: boolean) => {
    setYesNoAnswers(prev => ({ ...prev, [questionId]: value }));
    if (import.meta.env.DEV) console.log('✅ [Step3] Yes/No selected - NO RECALC', questionId, value);
  }, []);
  
  const handleEvChargerChange = useCallback((level: 'L2' | 'DCFast', value: number) => {
    if (level === 'L2') {
      setEvL2Chargers(value);
    } else {
      setEvDCFastChargers(value);
    }
    if (import.meta.env.DEV) console.log('✅ [Step3] EV charger changed - NO RECALC', level, value);
  }, []);
  
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);
  
  // ============================================
  // CALCULATE CATEGORY COUNTS
  // ============================================
  
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    AMENITY_CATEGORIES.forEach(cat => {
      if ('pills' in cat && cat.pills) {
        counts[cat.id] = cat.pills.filter(pill => selectedAmenities.includes(pill.id)).length;
      } else if ('isYesNo' in cat && cat.isYesNo && cat.questions) {
        counts[cat.id] = cat.questions.filter(q => yesNoAnswers[q.id] !== null).length;
      }
    });
    return counts;
  }, [selectedAmenities, yesNoAnswers]);
  
  // ============================================
  // VALIDATION
  // ============================================
  
  const isFormValid = useMemo(() => {
    // At least one size metric required
    const hasSize = roomCount > 0 || squareFeet > 0;
    return hasSize;
  }, [roomCount, squareFeet]);
  
  // ============================================
  // NEXT STEP - SYNC TO WIZARD STATE & CALCULATE
  // ============================================
  
  const handleNextStep = useCallback(() => {
    if (!isFormValid) return;
    
    // Sync all local state to wizardState (this triggers calculation in parent)
    setWizardState(prev => ({
      ...prev,
      useCaseData: {
        ...prev.useCaseData,
        roomCount,
        squareFootage: squareFeet,
        squareFeet, // Also set both variants
        selectedAmenities,
        backup_power: yesNoAnswers.backup_power,
        data_center: yesNoAnswers.data_center,
        evL2Chargers: selectedAmenities.includes('ev_charging') ? evL2Chargers : 0,
        evDCFastChargers: selectedAmenities.includes('ev_charging') ? evDCFastChargers : 0,
      },
      facilitySize: roomCount || squareFeet,
      wantsEVCharging: selectedAmenities.includes('ev_charging'),
      evChargersL2: selectedAmenities.includes('ev_charging') ? evL2Chargers : 0,
      evChargersDCFC: selectedAmenities.includes('ev_charging') ? evDCFastChargers : 0,
      wantsBackupPower: yesNoAnswers.backup_power === true,
    }));
    
    if (import.meta.env.DEV) console.log('🚀 [Step3] Next Step - NOW syncing to wizardState and calculating...');
    
    // Parent's onContinue will trigger calculation
    onContinue();
  }, [isFormValid, roomCount, squareFeet, selectedAmenities, yesNoAnswers, evL2Chargers, evDCFastChargers, setWizardState, onContinue]);
  
  // ============================================
  // QUICK ESTIMATES FOR HEADER (Lightweight)
  // ============================================
  
  const quickEstimate = useMemo(() => {
    const baseKW = roomCount * 3.5 || squareFeet * 0.006 || 100;
    const amenityKW = selectedAmenities.length * 25;
    const totalKW = Math.round(baseKW + amenityKW);
    return {
      batteryKW: Math.round(totalKW * 0.5),
      batteryKWh: Math.round(totalKW * 4),
      peakKW: totalKW,
    };
  }, [roomCount, squareFeet, selectedAmenities.length]);
  
  // ============================================
  // RENDER
  // ============================================
  
  if (isHidden) return null;
  
  const showEvExpanded = selectedAmenities.includes('ev_charging');
  
  return (
    <div
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-[100] bg-[rgba(15,15,35,0.95)] backdrop-blur-[10px] px-6 py-3 border-b border-white/10">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <button className="text-2xl">☰</button>
            <div className="text-2xl">🧙‍♂️</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Solar Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-[20px] text-[13px] font-semibold bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] text-[#1a1a2e]">
              ☀️ ✦✦✦✦✧
            </div>
            {/* Battery Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-[20px] text-[13px] font-semibold bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] text-[#1a1a2e]">
              🔋 {quickEstimate.batteryKWh} kWh <span className="text-[11px] opacity-80">{quickEstimate.batteryKW} kW total</span>
            </div>
            {/* Power Gap */}
            <div className="flex items-center gap-2 px-5 py-2 rounded-[20px] text-[13px] font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white">
              ⚡
              <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#4ADE80] rounded-full" style={{ width: '50%' }}></div>
              </div>
              50%
              <span className="text-[11px] opacity-80">Need {quickEstimate.peakKW} kW more</span>
            </div>
            {/* Savings Scout */}
            <div className="px-4 py-2 rounded-[20px] text-[13px] font-bold bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] text-[#1a1a2e] flex items-center gap-1.5">
              📊 Savings Scout™ 5 ▾
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-[60px] w-[200px] h-[calc(100vh-60px)] pt-5 z-50">
        <button className="flex items-center gap-2.5 w-[90%] px-4 py-3 mx-0 rounded-r-[24px] text-[14px] font-semibold bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] mb-1">
          ✓ TrueQuote™
        </button>
        <button className="flex items-center gap-2.5 w-[90%] px-4 py-3 mx-0 rounded-r-[24px] text-[14px] font-semibold bg-gradient-to-r from-[#DDD6FE] to-[#C4B5FD] text-[#5B21B6] mb-1">
          🧙‍♂️ Merlin Energy
        </button>
        <button className="flex items-center gap-2.5 w-[90%] px-4 py-3 mx-0 rounded-r-[24px] text-[14px] font-semibold bg-gradient-to-r from-[#6EE7B7] to-[#34D399] text-[#065F46]">
          ❓ How to Use
        </button>
      </div>
      
      {/* Main Content */}
      <div className="ml-[200px] px-6 py-6 pb-[120px] max-w-[900px]">
        
        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[rgba(139,92,246,0.3)] text-[#C4B5FD] px-3 py-1 rounded-xl text-xs font-semibold">
              STEP 3 OF 5
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#4ADE80] to-[#22D3EE] rounded-full" style={{ width: '60%' }}></div>
          </div>
          <div className="text-right text-xs text-white/50 mt-1">60%</div>
        </div>
        
        {/* Page Title */}
        <h1 className="text-[28px] font-extrabold mb-6">Confirm Your Property Details</h1>
        
        {/* Merlin Card */}
        <div className="bg-gradient-to-r from-[rgba(139,92,246,0.2)] to-[rgba(99,102,241,0.15)] border border-[rgba(139,92,246,0.3)] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 flex-shrink-0">
              <img src={merlinProfile} alt="Merlin" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#C4B5FD] mb-1 flex items-center gap-2">
                Merlin says: <span className="text-xs text-white/50 font-normal">⏱ 1-2 minutes</span>
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                I need a few details about your property to calculate accurate power requirements. The more detail you provide, the more precise your energy quote will be!
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-[13px] font-bold text-[#FCD34D] mb-2 flex items-center gap-1.5">💡 PRO TIPS</h4>
                <ul className="text-[13px] text-white/70 space-y-1">
                  <li className="flex items-start gap-2"><span className="text-[#4ADE80]">→</span> Larger properties typically benefit more from battery storage</li>
                  <li className="flex items-start gap-2"><span className="text-[#4ADE80]">→</span> Select all amenities that apply - each one affects power calculations</li>
                  <li className="flex items-start gap-2"><span className="text-[#4ADE80]">→</span> Don't worry about exact numbers - estimates work great!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Section */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-[10px] flex items-center justify-center text-lg">
              📍
            </div>
            <div className="text-base font-bold text-[#1e293b]">Location</div>
          </div>
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF] border-2 border-[#8B5CF6] rounded-xl text-base font-semibold text-[#1e293b] flex items-center justify-between cursor-pointer">
            <span>{wizardState.state || 'Select state...'}</span>
            <span className="text-[#8B5CF6]">▼</span>
          </div>
          {wizardState.state && (
            <div className="flex items-center gap-1 text-xs text-[#22C55E] mt-2">
              <Check className="w-3 h-3" /> {wizardState.state} electricity rates applied
            </div>
          )}
        </div>
        
        {/* Property Size Section */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-[10px] flex items-center justify-center text-lg">
              🏢
            </div>
            <div className="text-base font-bold text-[#1e293b]">Property Size</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#64748b]">Guest Rooms</label>
              <div className="relative">
                <input
                  type="number"
                  value={roomCount || ''}
                  onChange={(e) => handleRoomCountChange(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3.5 pr-14 border-2 rounded-xl text-base font-semibold text-[#1e293b] transition-all ${
                    roomCount > 0 
                      ? 'bg-gradient-to-br from-[#FEF9C3] to-[#FEF08A] border-[#EAB308]' 
                      : 'border-[#e2e8f0] focus:border-[#8B5CF6] focus:bg-[#FAF5FF]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8] font-medium">rooms</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#64748b]">Square Footage (optional)</label>
              <div className="relative">
                <input
                  type="number"
                  value={squareFeet || ''}
                  onChange={(e) => handleSquareFeetChange(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 100,000"
                  className="w-full px-4 py-3.5 pr-14 border-2 rounded-xl text-base font-semibold text-[#1e293b] transition-all border-[#e2e8f0] focus:border-[#8B5CF6] focus:bg-[#FAF5FF]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8] font-medium">sq ft</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Property Amenities Section */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-5 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#1e293b] mb-1">
              <span>✨</span>
              Property Amenities
            </div>
            <div className="text-[13px] text-[#64748b]">Select all that apply (affects energy sizing)</div>
          </div>
          
          {AMENITY_CATEGORIES.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const count = categoryCounts[category.id] || 0;
            
            if ('isYesNo' in category && category.isYesNo) {
              // Yes/No Category
              return (
                <div key={category.id} className="border-b border-[#f1f5f9] last:border-b-0">
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-[#f8fafc] transition-colors"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="flex-1 text-[15px] font-semibold text-[#1e293b]">{category.label}</span>
                    {count > 0 && (
                      <span className="bg-[#8B5CF6] text-white text-[11px] font-bold px-2.5 py-1 rounded-[10px] min-w-[24px] text-center">
                        {count}
                      </span>
                    )}
                    <span className={`text-sm text-[#94a3b8] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                  {isExpanded && category.questions && (
                    <div className="px-6 pb-5 bg-[#f8fafc] mx-3 mb-3 rounded-xl">
                      {category.questions.map(question => (
                        <div key={question.id} className="mb-4 last:mb-0">
                          <div className="text-sm font-semibold text-[#1e293b] mb-2.5">{question.label}</div>
                          <div className="flex gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleYesNoAnswer(question.id, true);
                              }}
                              className={`flex-1 max-w-[120px] px-5 py-3 border-2 rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
                                yesNoAnswers[question.id] === true
                                  ? 'bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] border-[#22C55E] text-[#166534]'
                                  : 'bg-white border-[#e2e8f0] text-[#64748b]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                yesNoAnswers[question.id] === true ? 'bg-[#22C55E] text-white' : 'bg-[#e2e8f0]'
                              }`}>
                                ✓
                              </span>
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleYesNoAnswer(question.id, false);
                              }}
                              className={`flex-1 max-w-[120px] px-5 py-3 border-2 rounded-[10px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
                                yesNoAnswers[question.id] === false
                                  ? 'bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] border-[#EF4444] text-[#991B1B]'
                                  : 'bg-white border-[#e2e8f0] text-[#64748b]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                yesNoAnswers[question.id] === false ? 'bg-[#EF4444] text-white' : 'bg-[#e2e8f0]'
                              }`}>
                                ✕
                              </span>
                              No
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            // Pill Category
            if (!('pills' in category) || !category.pills) return null;
            
            return (
              <div key={category.id} className={`border-b border-[#f1f5f9] last:border-b-0 ${isExpanded ? 'expanded' : ''}`}>
                <div
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="flex-1 text-[15px] font-semibold text-[#1e293b]">{category.label}</span>
                  {count > 0 && (
                    <span className="bg-[#8B5CF6] text-white text-[11px] font-bold px-2.5 py-1 rounded-[10px] min-w-[24px] text-center">
                      {count}
                    </span>
                  )}
                  <span className={`text-sm text-[#94a3b8] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="px-6 pb-5 flex flex-wrap gap-2.5">
                    {category.pills.map(pill => {
                      const isSelected = selectedAmenities.includes(pill.id);
                      return (
                        <button
                          key={pill.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAmenityToggle(pill.id);
                          }}
                          className={`inline-flex items-center gap-2 px-[18px] py-2.5 border-2 rounded-[24px] text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-[#8B5CF6] bg-gradient-to-r from-[#EDE9FE] to-[#DDD6FE] text-[#6D28D9]'
                              : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-[#c7d2fe] hover:bg-[#faf5ff]'
                          }`}
                        >
                          <span className="text-base">{pill.icon}</span>
                          {pill.label}
                          {isSelected && <span className="text-[#22C55E] font-bold">✓</span>}
                        </button>
                      );
                    })}
                    
                    {/* Expanded content for EV Charging */}
                    {category.id === 'services' && showEvExpanded && (
                      <div className="w-full mt-4 pt-4 border-t border-[#f1f5f9]">
                        <div className="text-sm font-semibold text-[#1e293b] mb-3">How many EV chargers do you want?</div>
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="number"
                            value={evL2Chargers || ''}
                            onChange={(e) => handleEvChargerChange('L2', parseInt(e.target.value) || 0)}
                            className="w-[100px] px-3.5 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-[15px] font-semibold focus:outline-none focus:border-[#8B5CF6]"
                          />
                          <label className="text-sm text-[#475569]">Level 2 chargers</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={evDCFastChargers || ''}
                            onChange={(e) => handleEvChargerChange('DCFast', parseInt(e.target.value) || 0)}
                            className="w-[100px] px-3.5 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-[15px] font-semibold focus:outline-none focus:border-[#8B5CF6]"
                          />
                          <label className="text-sm text-[#475569]">DC Fast chargers</label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Completion Message */}
        {isFormValid && (
          <div className="flex items-center justify-center gap-2.5 py-4 text-[#22C55E] text-[15px] font-semibold">
            <Check className="w-4 h-4" />
            Looking good! Click Next Step when ready.
          </div>
        )}
      </div>
      
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-[200px] right-0 bg-[rgba(15,15,35,0.98)] backdrop-blur-[10px] border-t border-white/10 px-6 py-4 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#6366F1] text-white border-none rounded-[10px] text-sm font-semibold flex items-center gap-1.5"
          >
            ← Back
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="px-4 py-3 bg-white/10 text-white border-none rounded-[10px] text-lg"
            >
              🏠
            </button>
          )}
        </div>
        <button
          onClick={handleNextStep}
          disabled={!isFormValid}
          className={`px-8 py-3.5 rounded-[10px] text-[15px] font-bold flex items-center gap-2 transition-all ${
            isFormValid
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.4)]'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}

export default Step3FacilityDetailsV3;

