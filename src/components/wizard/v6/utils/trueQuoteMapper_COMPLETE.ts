/**
 * TrueQuote Engine Input Mapper
 * ==============================
 * Maps WizardState to TrueQuoteInput format
 * Shared between Step 4 and Step 5
 */

import type { WizardState } from '../types';
import type { TrueQuoteInput } from '@/services/TrueQuoteEngine';

export function mapWizardStateToTrueQuoteInput(state: WizardState): TrueQuoteInput {
  // Map industry slug (convert 'data_center' to 'data-center', etc.)
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
  
  const industryType = industryTypeMap[state.industry] || state.industry;
  
  // Extract subtype from useCaseData
  let subtype: string | undefined;
  
  if (industryType === 'data-center') {
    const dcTier = state.useCaseData?.dataCenterTier || state.useCaseData?.tierClassification;
    if (dcTier) {
      if (dcTier === 'tier1') subtype = 'tier_1';
      else if (dcTier === 'tier2') subtype = 'tier_2';
      else if (dcTier === 'tier3') subtype = 'tier_3';
      else if (dcTier === 'tier4') subtype = 'tier_4';
      else if (dcTier.includes('_')) subtype = dcTier;
      else subtype = 'tier_3';
    } else {
      subtype = 'tier_3';
    }
  } else if (industryType === 'hotel') {
    subtype = state.useCaseData?.hotelType || state.useCaseData?.hotel_type || state.useCaseData?.hotelCategory || 'midscale';
  } else if (industryType === 'hospital') {
    subtype = state.useCaseData?.hospitalType || state.useCaseData?.hospital_type || 'community';
  } else if (industryType === 'car-wash') {
    subtype = state.useCaseData?.washType || state.useCaseData?.wash_type || 'express';
  } else if (industryType === 'manufacturing') {
    subtype = state.useCaseData?.manufacturingType || 
              state.useCaseData?.industryType || 
              'lightAssembly';
  } else if (industryType === 'retail') {
    subtype = state.useCaseData?.retailType || state.useCaseData?.retail_type || 'convenienceStore';
  } else if (industryType === 'restaurant') {
    subtype = state.useCaseData?.restaurantType || state.useCaseData?.restaurant_type || 'qsr';
  } else if (industryType === 'office') {
    subtype = state.useCaseData?.officeType || state.useCaseData?.office_type || 'smallOffice';
  } else if (industryType === 'university') {
    const enrollment = state.useCaseData?.enrollment || state.useCaseData?.studentCount;
    if (enrollment) {
      const num = parseFloat(String(enrollment));
      if (num < 5000) subtype = 'communityCollege';
      else if (num < 20000) subtype = 'regionalPublic';
      else if (num < 30000) subtype = 'largeState';
      else subtype = 'majorResearch';
    } else {
      subtype = state.useCaseData?.campusType || 'regionalPublic';
    }
  } else if (industryType === 'agriculture') {
    subtype = state.useCaseData?.farmType || 
              state.useCaseData?.agricultureType || 
              'rowCrops';
  } else if (industryType === 'warehouse') {
    subtype = state.useCaseData?.warehouseType || 
              state.useCaseData?.warehouse_type || 
              'general';
  } else if (industryType === 'casino') {
    subtype = 'default';
  } else if (industryType === 'apartment') {
    subtype = 'default';
  } else if (industryType === 'cold-storage') {
    subtype = 'default';
  } else if (industryType === 'shopping-center') {
    subtype = 'default';
  } else if (industryType === 'indoor-farm') {
    subtype = 'default';
  } else if (industryType === 'government') {
    subtype = 'default';
  } else {
    subtype = 'default';
  }
  
  // Normalize facilityData field names for TrueQuote Engine
  const facilityData = state.useCaseData ? { ...state.useCaseData } : {};
  
  // Manufacturing: Map squareFootage → facilitySqFt
  if (industryType === 'manufacturing' && facilityData.squareFootage && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFootage));
  }
  
  // Retail: Map storeSqFt → facilitySqFt
  if (industryType === 'retail' && facilityData.storeSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.storeSqFt));
  } else if (industryType === 'retail' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Restaurant: Map restaurantSqFt → facilitySqFt
  if (industryType === 'restaurant' && facilityData.restaurantSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.restaurantSqFt));
  } else if (industryType === 'restaurant' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Office: Map buildingSqFt → facilitySqFt
  if (industryType === 'office' && facilityData.buildingSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.buildingSqFt));
  } else if (industryType === 'office' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // University: Map squareFeet → facilitySqFt
  if (industryType === 'university' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Warehouse: Map squareFeet → facilitySqFt
  if (industryType === 'warehouse' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Apartment: Map unitCount → units for TrueQuote Engine
  if (industryType === 'apartment' && facilityData.unitCount && !facilityData.units) {
    facilityData.units = parseFloat(String(facilityData.unitCount));
  }
  
  // Data Center: Map targetPUE → powerUsageEffectiveness
  if (industryType === 'data-center' && facilityData.targetPUE && !facilityData.powerUsageEffectiveness) {
    facilityData.powerUsageEffectiveness = parseFloat(String(facilityData.targetPUE));
  }
  
  // Casino: Map gamingFloorSize → facilitySqFt
  if (industryType === 'casino' && facilityData.gamingFloorSize && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.gamingFloorSize));
  }
  
  // Cold Storage: Map storageVolume (cubic feet) → facilitySqFt (divide by 30 for avg ceiling height)
  if (industryType === 'cold-storage' && facilityData.storageVolume && !facilityData.facilitySqFt) {
    const volumeCuFt = parseFloat(String(facilityData.storageVolume));
    facilityData.facilitySqFt = Math.round(volumeCuFt / 30); // 30ft average cold storage ceiling
  }
  
  // Shopping Center: Map retailSqFt → facilitySqFt
  if (industryType === 'shopping-center' && facilityData.retailSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.retailSqFt));
  } else if (industryType === 'shopping-center' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Indoor Farm: Map growingAreaSqFt → facilitySqFt
  if (industryType === 'indoor-farm' && facilityData.growingAreaSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.growingAreaSqFt));
  } else if (industryType === 'indoor-farm' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Government: Map buildingSqFt → facilitySqFt
  if (industryType === 'government' && facilityData.buildingSqFt && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.buildingSqFt));
  } else if (industryType === 'government' && facilityData.squareFeet && !facilityData.facilitySqFt) {
    facilityData.facilitySqFt = parseFloat(String(facilityData.squareFeet));
  }
  
  // Hotel: roomCount MUST be captured from user - no default!
  if (industryType === 'hotel') {
    if (!facilityData.roomCount || facilityData.roomCount === 0) {
      console.error('❌ CRITICAL: Hotel roomCount is missing! This is required for accurate BESS sizing.');
      console.error('   Step3HotelEnergy must capture roomCount from user input.');
    }
  }
  
  // 🔍 DEBUG: Log what we're passing to TrueQuote Engine
  console.log('🔍 [mapWizardStateToTrueQuoteInput] DEBUG:', {
    industry: state.industry,
    industryType,
    subtype,
    useCaseDataKeys: state.useCaseData ? Object.keys(state.useCaseData) : [],
    facilityDataSample: facilityData,
  });
  
  return {
    location: {
      zipCode: state.zipCode || '89052',
      state: state.state || 'NV',
    },
    industry: {
      type: industryType,
      subtype: subtype || 'default',
      facilityData,
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
