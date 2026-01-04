/**
 * TrueQuote Engine Input Mapper
 * ==============================
 * Maps WizardState to TrueQuoteInput format
 * Shared between Step 4 and Step 5
 * 
 * ✅ REFACTORED: Now uses systematic configuration instead of if/else blocks
 */

import type { WizardState } from '../types';
import type { TrueQuoteInput } from '@/services/TrueQuoteEngine';
import { mapSubtype, mapFieldName, DEFAULT_SUBTYPES } from '@/services/trueQuoteMapperConfig';

// Industry slug normalization
const industryTypeMap: Record<string, string> = {
  'data_center': 'data-center',
  'data-center': 'data-center',
  'ev_charging': 'ev-charging',
  'ev-charging': 'ev-charging',
  'car_wash': 'car-wash',
  'car-wash': 'car-wash',
  'hotel': 'hotel',
  'hospital': 'hospital',
  'manufacturing': 'manufacturing',
  'retail': 'retail',
  'restaurant': 'restaurant',
  'office': 'office',
  'college': 'university',
  'university': 'university',
  'agriculture': 'agriculture',
  'warehouse': 'warehouse',
  'casino': 'casino',
  'apartment': 'apartment',
  'apartments': 'apartment',
  'apartment-building': 'apartment',
  'cold-storage': 'cold-storage',
  'cold_storage': 'cold-storage',
  'shopping-center': 'shopping-center',
  'shopping-mall': 'shopping-center',
  'shopping_mall': 'shopping-center',
  'indoor-farm': 'indoor-farm',
  'indoor_farm': 'indoor-farm',
  'government': 'government',
  'public-building': 'government',
};

/**
 * Get subtype field name for an industry
 */
function getSubtypeFieldName(industry: string): string {
  const fieldMap: Record<string, string> = {
    'data-center': 'dataCenterTier',
    'hospital': 'hospitalType',
    'hotel': 'hotelCategory',
    'ev-charging': 'hubType',
    'car-wash': 'carWashType',
    'manufacturing': 'manufacturingType',
    'retail': 'retailType',
    'restaurant': 'restaurantType',
    'office': 'officeType',
    'university': 'institutionType',
    'shopping-center': 'propertyType',
    'apartment': 'propertyType',
    'government': 'facilityType',
    'warehouse': 'warehouseType',
    'casino': 'casinoType',
    'agriculture': 'farmType',
    'indoor-farm': 'farmType',
    'cold-storage': 'facilityType',
  };
  return fieldMap[industry] || 'type';
}

export function mapWizardStateToTrueQuoteInput(state: WizardState): TrueQuoteInput {
  // Normalize industry slug
  const industryType = industryTypeMap[state.industry] || state.industry;
  
  // ✅ SYSTEMATIC: Extract subtype using configuration
  const subtypeFieldName = getSubtypeFieldName(industryType);
  const dbSubtypeValue = state.useCaseData?.[subtypeFieldName] || 
                         state.useCaseData?.hospital_type || 
                         state.useCaseData?.hotel_type ||
                         state.useCaseData?.hotelCategory ||
                         state.useCaseData?.washType ||
                         state.useCaseData?.wash_type;
  
  // Use systematic mapping function from config
  let subtype = mapSubtype(industryType, dbSubtypeValue);
  if (!subtype) {
    // Fallback to default if mapping fails
    subtype = DEFAULT_SUBTYPES[industryType] || 'default';
  }
  
  // Special handling for university (enrollment-based logic takes precedence)
  if (industryType === 'university') {
    const enrollment = state.useCaseData?.enrollment || state.useCaseData?.studentCount;
    if (enrollment) {
      const num = parseFloat(String(enrollment));
      if (num < 5000) subtype = 'communityCollege';
      else if (num < 20000) subtype = 'regionalPublic';
      else if (num < 30000) subtype = 'largeState';
      else subtype = 'majorResearch';
    }
  }
  
  // Normalize facilityData field names using configuration
  const facilityData: Record<string, any> = {};
  if (state.useCaseData) {
    for (const [key, value] of Object.entries(state.useCaseData)) {
      const mappedKey = mapFieldName(industryType, key);
      facilityData[mappedKey] = value;
    }
  }
  
  // ✅ SPECIAL LOGIC: Hotel amenity strings → boolean modifiers
  if (industryType === 'hotel') {
    if (!facilityData.roomCount || facilityData.roomCount === 0) {
      console.error('❌ CRITICAL: Hotel roomCount is missing! This is required for accurate BESS sizing.');
      console.error('   Step3HotelEnergy must capture roomCount from user input.');
    }
    
    // Map amenity strings to boolean triggers for TrueQuoteEngine modifiers
    if (facilityData.foodBeverage && facilityData.foodBeverage !== 'none') {
      facilityData.hasRestaurant = true;
    }
    if (facilityData.spaServices && facilityData.spaServices !== 'none') {
      facilityData.hasSpa = true;
    }
    if (facilityData.poolType && facilityData.poolType !== 'none') {
      facilityData.hasPool = true;
    }
    if (facilityData.meetingSpace && facilityData.meetingSpace !== 'none') {
      facilityData.hasConferenceCenter = true;
    }
    if (facilityData.laundryType && facilityData.laundryType !== 'none' && facilityData.laundryType !== 'outsourced') {
      facilityData.hasLaundry = true;
    }
    if (facilityData.fitnessCenter && facilityData.fitnessCenter !== 'none') {
      facilityData.hasFitnessCenter = true;
    }
    
    // 🔍 DEBUG: Log what modifiers were applied
    const appliedModifiers = [];
    if (facilityData.hasRestaurant) appliedModifiers.push('Restaurant (+15%)');
    if (facilityData.hasSpa) appliedModifiers.push('Spa (+10%)');
    if (facilityData.hasPool) appliedModifiers.push('Pool (+5%)');
    if (facilityData.hasConferenceCenter) appliedModifiers.push('Conference Center (+20%)');
    if (appliedModifiers.length > 0) {
      console.log('✅ Step 3 Modifiers Applied:', appliedModifiers.join(', '));
    }
  }
  
  // ✅ SPECIAL LOGIC: Hospital modifiers (ICU, OR, MRI)
  if (industryType === 'hospital') {
    // Ensure bedCount is present (TrueQuote Engine uses this for per_bed calculations)
    if (facilityData.bedCount && !facilityData.beds) {
      facilityData.beds = parseFloat(String(facilityData.bedCount));
    }
    
    // Map hospital specific fields to TrueQuote Engine modifier triggers
    if (facilityData.icuBeds && parseFloat(String(facilityData.icuBeds)) > 0) {
      facilityData.hasICU = true;
    }
    if (facilityData.operatingRooms && parseFloat(String(facilityData.operatingRooms)) > 0) {
      facilityData.hasOR = true;
    }
    // Check for imaging equipment (MRI, CT Scan, Xray)
    if (facilityData.imagingEquipment) {
      const imaging = Array.isArray(facilityData.imagingEquipment) 
        ? facilityData.imagingEquipment 
        : [facilityData.imagingEquipment];
      const imagingStr = imaging.map(i => String(i).toLowerCase()).join(',');
      if (imagingStr.includes('mri') || imagingStr.includes('ct') || imagingStr.includes('scan')) {
        facilityData.hasMRI = true;
      }
    }
  }
  
  // Handle special field mappings (using mapFieldName, but also handle specific cases)
  // Apartment: Map unitCount → units for TrueQuote Engine
  if (industryType === 'apartment' && facilityData.unitCount && !facilityData.units) {
    facilityData.units = parseFloat(String(facilityData.unitCount));
  }
  
  // Data Center: Map targetPUE → powerUsageEffectiveness
  if (industryType === 'data-center' && facilityData.targetPUE && !facilityData.powerUsageEffectiveness) {
    facilityData.powerUsageEffectiveness = parseFloat(String(facilityData.targetPUE));
  }
  
  // Cold Storage: Map storageVolume (cubic feet) → facilitySqFt (divide by 30 for avg ceiling height)
  if (industryType === 'cold-storage' && facilityData.storageVolume && !facilityData.facilitySqFt) {
    const volumeCuFt = parseFloat(String(facilityData.storageVolume));
    facilityData.facilitySqFt = Math.round(volumeCuFt / 30); // 30ft average cold storage ceiling
  }
  
  // 🔍 DEBUG: Log what we're passing to TrueQuote Engine
  // Always log in development (check for localhost or dev environment)
  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    (window as any).__DEV__
  );
  
  if (isDev) {
    console.log('🔍 [mapWizardStateToTrueQuoteInput] DEBUG:', {
      industry: state.industry,
      industryType,
      subtype,
      subtypeFieldName,
      dbSubtypeValue,
      useCaseData: state.useCaseData || {},
      useCaseDataKeys: state.useCaseData ? Object.keys(state.useCaseData) : [],
      facilityData: facilityData,
      facilityDataKeys: Object.keys(facilityData),
      facilityDataSample: Object.fromEntries(Object.entries(facilityData).slice(0, 10)),
    });
  }
  
  // Build TrueQuoteInput matching the interface structure
  return {
    location: {
      zipCode: state.zipCode || '89052',
      state: state.state || 'NV',
    },
    industry: {
      type: industryType,
      subtype: subtype,
      facilityData: facilityData,
    },
    options: {
      solarEnabled: state.selectedOptions?.includes('solar') || false,
      evChargingEnabled: state.selectedOptions?.includes('ev') || false,
      generatorEnabled: state.selectedOptions?.includes('generator') || false,
      level2Chargers: state.customEvL2 || 0,
      dcFastChargers: state.customEvDcfc || 0,
      ultraFastChargers: state.customEvUltraFast || 0,
    },
  };
}
