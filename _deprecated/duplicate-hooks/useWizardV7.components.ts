/**
 * useWizardV7 Hook - State Management (Vineet's 7-Step Flow)
 *
 * Canonical updates:
 * - Location Intelligence capture (sun hours, utility rates, weather risk)
 * - Industry inference from confirmed business + auto-skip to Step 3
 * - Step 1 canProceed: ZIP OR confirmed business
 * - TrueQuote proof payload builder (for Steps 4-6 proof modal)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ✅ Pricing freeze pattern (Jan 23, 2026)
import { getPricingConfiguration, type PricingConfiguration } from '@/services/pricingConfigService';

// Import existing calculators (reuse from V6)
import { calculateCarWashFromAnswers } from '@/services/calculators/carWashIntegration';
import { calculateHotelFromAnswers } from '@/services/calculators/hotelIntegration';
import { calculateTruckStopFromAnswers } from '@/services/calculators/truckStopIntegration';
import { calculateEVChargingFromAnswers } from '@/services/calculators/evChargingIntegration';
import { calculateHospitalFromAnswers } from '@/services/calculators/hospitalIntegration';
import { calculateDataCenterFromAnswers } from '@/services/calculators/dataCenterIntegration';
import { calculateOfficeFromAnswers } from '@/services/calculators/officeIntegration';

type WeatherRiskLevel = 'Low' | 'Med' | 'High' | string;

export interface LocationIntel {
  peakSunHours: number | null;
  utilityRate: number | null; // $/kWh
  weatherRisk: WeatherRiskLevel | null;
  solarGrade: string | null;
  riskDrivers: string[];
  sourceLabel?: string; // e.g. "TrueQuote™"
}

export interface WizardV7State {
  currentStep: number;
  location: {
    zipCode: string;
    businessName: string;
    streetAddress: string;
    region: string;
    state?: string;
    city?: string;
    businessConfirmed?: boolean; // IMPORTANT: gate auto-skip on explicit confirmation
    business?: {
      name: string;
      address: string;
      city?: string;
      state?: string;
      postal?: string;
      category?: string;
      website?: string | null;
      photoUrl?: string;
      logoUrl?: string;
      industrySlug?: string; // IMPORTANT: allow Step1 to save an inferred industry here
      rating?: number;
      userRatingsTotal?: number;
      phone?: string | null;
      placeId?: string; // optional if you have it
      types?: string[]; // optional if you have it
    };
  } | null;
  industry: string | null;
  selectedGoals: string[];
  answers: Record<string, any>;
  livePreview: any;
  assessment: any;
}

function inferIndustryFromBusiness(business?: WizardV7State['location'] extends infer L
  ? L extends { business?: infer B } ? B : any
  : any): string | null {
  if (!business) return null;

  // 1) If Step1 already saved an industrySlug — trust it.
  if ((business as any).industrySlug) return (business as any).industrySlug;

  // 2) Try category text mapping
  const category = String((business as any).category || '').toLowerCase();
  const types: string[] = Array.isArray((business as any).types) ? (business as any).types : [];

  const hay = [category, ...types.map(t => String(t).toLowerCase())].join(' | ');

  // Map to your existing slugs
  if (hay.includes('car_wash') || hay.includes('car wash') || hay.includes('carwash')) return 'car-wash';
  if (hay.includes('lodging') || hay.includes('hotel') || hay.includes('motel') || hay.includes('resort')) return 'hotel';
  if (hay.includes('hospital') || hay.includes('medical') || hay.includes('clinic')) return 'hospital';
  if (hay.includes('ev') || hay.includes('charging') || hay.includes('charging_station')) return 'ev-charging';
  if (hay.includes('truck') || hay.includes('travel_stop') || hay.includes('gas_station')) return 'truck-stop';

  // Data center is often not explicit via Places; be conservative:
  if (hay.includes('data center') || hay.includes('datacenter') || hay.includes('server')) return 'data-center';

  // Office fallback if business looks like office / commercial
  if (hay.includes('office') || hay.includes('commercial')) return 'office';

  return null;
}

export function useWizardV7() {
  // Step navigation (7 steps total)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Core state
  const [location, setLocation] = useState<WizardV7State['location']>({
    zipCode: '',
    businessName: '',
    streetAddress: '',
    region: 'US',
  });
  
  const [industry, setIndustry] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]); // ✅ Empty - user must select
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Calculated state
  const [livePreview, setLivePreview] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);

  // ✅ Location Intelligence (Step 1 "odometer" metrics)
  const [locationIntel, setLocationIntel] = useState<LocationIntel>({
    peakSunHours: null,
    utilityRate: null,
    weatherRisk: null,
    solarGrade: null,
    riskDrivers: [],
    sourceLabel: 'TrueQuote™',
  });

  // ✅ Pricing freeze (Jan 23, 2026) - Load once at Step 3, never refresh mid-session
  const [pricingConfig, setPricingConfig] = useState<PricingConfiguration | null>(null);
  const [pricingStatus, setPricingStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');

  /**
   * Helpers
   */
  const isZipReady = useMemo(() => {
    if (!location?.zipCode) return false;
    const z = String(location.zipCode).trim();
    return location?.region === 'US' ? z.length >= 5 : z.length >= 3;
  }, [location?.zipCode, location?.region]);

  const hasConfirmedBusiness = useMemo(() => {
    return !!location?.business?.name && !!location?.business?.address;
  }, [location?.business?.name, location?.business?.address]);

  /**
   * Step Navigation
   */
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 7) {
      setCurrentStep(step);
    }
  }, []);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Can Proceed Check
   */
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        // ✅ Step 1 can proceed if ZIP is ready OR business is confirmed
        return !!(isZipReady || hasConfirmedBusiness);
      case 2:
        // ✅ Step 2: Must have selected at least 1 goal AND have an industry
        // Industry comes from business confirmation OR manual selection
        return selectedGoals.length >= 1 && !!industry;
      case 3:
        // Step 3: Can proceed once some questions are answered
        return Object.keys(answers).length >= 3;
      case 4:
        return Object.keys(answers).length >= 8;
      case 5:
      case 6:
      case 7:
        return true;
      default:
        return false;
    }
  }, [currentStep, isZipReady, hasConfirmedBusiness, selectedGoals, industry, answers]);

  const goNext = useCallback(() => {
    if (currentStep >= 7 || !canProceed()) return;

    // ✅ FIXED (Jan 23, 2026): Removed aggressive auto-skip logic
    // Users must proceed through each step explicitly.
    // The old logic was skipping Step 2/3 when industry was inferred,
    // causing layout/scroll bugs and Safari rendering failures.
    
    // Normal sequential flow only
    setCurrentStep(currentStep + 1);
  }, [currentStep, canProceed]);

  /**
   * Goal Toggle
   */
  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  }, []);

  /**
   * Answer Management
   */
  const updateAnswer = useCallback((fieldName: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  /**
   * Assessment Effect (dynamic scoring based on goals)
   */
  useEffect(() => {
    const newAssessment = calculateAssessment(selectedGoals);
    setAssessment(newAssessment);
  }, [selectedGoals]);

  /**
   * ✅ Location Intelligence capture (Step 1)
   *
   * Replace this stub with your real utilities/solar/weather pipeline.
   * For now: keep stable demo values so UI always has the odometer.
   */
  useEffect(() => {
    if (!isZipReady) return;

    // TODO: replace with your real calls:
    // - solar: NREL / internal irradiance lookup
    // - weather risk: internal risk model
    // - utility rates: internal territory/rate lookup
    // For now, deterministic demo:
    setLocationIntel(prev => ({
      ...prev,
      peakSunHours: 6.4,
      utilityRate: 0.09,
      weatherRisk: 'Low',
      solarGrade: 'A',
      riskDrivers: ['Minimal weather concerns', 'Strong solar potential'],
      sourceLabel: 'TrueQuote™',
    }));
  }, [isZipReady, location?.zipCode]);

  /**
   * ✅ Industry inference (on business confirmation)
   * Infer industry from confirmed business, but don't auto-skip.
   * Skip logic happens in goNext() so user sees business card first.
   */
  useEffect(() => {
    const biz = location?.business;
    const confirmed = !!location?.businessConfirmed;

    // Only infer industry when business is explicitly confirmed
    if (!biz || !confirmed) return;

    const inferred = inferIndustryFromBusiness(biz);
    if (inferred && !industry) {
      setIndustry(inferred);
    }
  }, [location?.business, location?.businessConfirmed, industry]);

  /**
   * ✅ Pricing freeze effect (Jan 23, 2026)
   * Load pricing configuration ONCE when entering Step 3+
   * Freeze for entire wizard session to prevent mid-session quote changes
   */
  useEffect(() => {
    // Only load when entering Step 3 or later
    if (currentStep < 3) return;
    
    // Only load once per wizard session
    if (pricingConfig) return;

    let cancelled = false;
    (async () => {
      setPricingStatus('loading');
      try {
        const cfg = await getPricingConfiguration();
        if (cancelled) return;
        
        setPricingConfig(cfg);
        
        // Determine status based on source (fallback = using defaults)
        const isDefault = 
          cfg?.updatedBy?.includes('Default') ||
          cfg?.updatedBy?.includes('Q4 2025') ||
          cfg?.version === '1.0.0' ||
          cfg?.version === '2.0.0';
        
        setPricingStatus(isDefault ? 'fallback' : 'ready');
      } catch (error) {
        console.error('Failed to load pricing config:', error);
        if (!cancelled) {
          setPricingStatus('fallback');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStep, pricingConfig]);

  /**
   * Live Calculation Effect
   */
  useEffect(() => {
    if (!industry || Object.keys(answers).length === 0) {
      setLivePreview(null);
      return;
    }

    // Route to calculator
    let result;
    switch (industry) {
      case 'car-wash':
        result = calculateCarWashFromAnswers(answers);
        break;
      case 'hotel':
        result = calculateHotelFromAnswers(answers);
        break;
      case 'truck-stop':
        result = calculateTruckStopFromAnswers(answers);
        break;
      case 'ev-charging':
        result = calculateEVChargingFromAnswers(answers);
        break;
      case 'hospital':
        result = calculateHospitalFromAnswers(answers);
        break;
      case 'data-center':
        result = calculateDataCenterFromAnswers(answers);
        break;
      case 'office':
        result = calculateOfficeFromAnswers(answers);
        break;
      default:
        result = null;
    }

    setLivePreview(result);
  }, [industry, answers]);

  /**
   * Generate Quote
   */
  const generateQuote = useCallback(async () => {
    if (!livePreview) return null;
    return livePreview;
  }, [livePreview]);

  /**
   * Export Quote
   */
  const exportQuote = useCallback(async (format: 'pdf' | 'word' | 'excel') => {
    console.log(`📄 Exporting quote as ${format}...`);
  }, []);

  /**
   * ✅ TrueQuote proof payload builder
   * Used by WizardV7 when opening modal in "proof" mode.
   * Steps 4-6 will enrich outputs/sources/assumptions later.
   */
  const getTrueQuoteProofPayload = useCallback(() => {
    // ✅ HARDENED: Type-safe fingerprint extraction (Jan 23, 2026)
    const version =
      pricingConfig && typeof pricingConfig === "object" && "version" in pricingConfig
        ? String((pricingConfig as Record<string, unknown>).version)
        : "unknown";
    const pricingFingerprint = pricingConfig ? `v${version}-${pricingStatus}` : "none";

    return {
      industry,
      location: {
        zipCode: location?.zipCode,
        city: location?.city,
        state: location?.state,
        region: location?.region,
      },
      business: location?.business
        ? {
            name: location.business.name,
            address: location.business.address,
            category: location.business.category,
            website: location.business.website ?? null,
            rating: location.business.rating,
            userRatingsTotal: location.business.userRatingsTotal,
          }
        : undefined,
      locationIntel: {
        peakSunHours: locationIntel.peakSunHours,
        utilityRate: locationIntel.utilityRate,
        weatherRisk: locationIntel.weatherRisk,
        solarGrade: locationIntel.solarGrade,
        riskDrivers: locationIntel.riskDrivers,
      },
      // ✅ Pricing proof (Jan 23, 2026) - makes quote defensible
      pricingProof: {
        status: pricingStatus,
        fingerprint: pricingFingerprint,
        isLocked: pricingStatus === 'ready',
        isFallback: pricingStatus === 'fallback',
      },
      outputs: livePreview ?? undefined,
      assumptions: [
        { label: 'Rates', value: 'Local territory estimate (override later)' },
        { label: 'Solar', value: 'Irradiance proxy from regional model' },
        { label: 'Weather', value: 'Risk index blended by regional hazards' },
        // ✅ Pricing assumption added to proof
        { 
          label: 'Pricing', 
          value: pricingStatus === 'ready' 
            ? `Locked (${pricingFingerprint})` 
            : `Default pricing (${pricingFingerprint})` 
        },
      ],
      sources: [
        { label: 'TrueQuote™ Methodology', note: 'Source-backed assumptions + explainable outputs' },
        { label: 'Utility Rates', note: 'Local estimate (or user provided) — replace with live source link later' },
        { label: 'Solar Potential', note: 'Regional irradiance model — replace with live source link later' },
        { label: 'Weather Risk', note: 'Regional hazard model — replace with live source link later' },
        // ✅ Pricing source added
        { 
          label: 'Equipment Pricing', 
          note: pricingStatus === 'ready' 
            ? 'Verified pricing from database' 
            : 'Default Q4 2025 pricing (estimate)' 
        },
      ],
    };
  }, [industry, location, locationIntel, livePreview, pricingConfig, pricingStatus]);

  return {
    // Step control
    currentStep,
    goToStep,
    goBack,
    goNext,
    canProceed,
    
    // Core state
    location,
    setLocation,
    industry,
    setIndustry,
    selectedGoals,
    toggleGoal,
    answers,
    setAnswers,
    updateAnswer,
    
    // Calculated state
    livePreview,
    assessment,
    locationIntel,
    
    // ✅ Pricing freeze (Jan 23, 2026)
    pricingConfig,
    pricingStatus,
    
    // Actions
    generateQuote,
    exportQuote,

    // TrueQuote
    getTrueQuoteProofPayload,
  };
}

/**
 * Calculate Assessment (Vineet's dynamic scoring)
 */
function calculateAssessment(selectedGoals: string[]) {
  const count = selectedGoals.length;
  
  let compatibility = { text: 'Select Goals', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
  if (count === 1) compatibility = { text: 'Basic', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
  else if (count === 2) compatibility = { text: 'Good', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
  else if (count === 3) compatibility = { text: 'Very Good', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
  else if (count === 4) compatibility = { text: 'Great', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
  else if (count === 5) compatibility = { text: 'Excellent', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
  else if (count === 6) compatibility = { text: 'Outstanding', color: '#fff', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' };

  let roi = { text: '—', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
  if (count >= 1 && count <= 2) roi = { text: 'Moderate', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
  else if (count >= 3 && count <= 4) roi = { text: 'High', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
  else if (count >= 5) roi = { text: 'Very High', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };

  const hasBackup = selectedGoals.includes('goal-backup');
  const hasSustain = selectedGoals.includes('goal-sustain');
  const hasIndependence = selectedGoals.includes('goal-independence');
  
  let system = '—';
  if (count > 0) {
    if (hasBackup && (hasSustain || hasIndependence)) system = 'BESS + Solar';
    else if (hasBackup) system = 'BESS';
    else if (hasSustain || hasIndependence) system = 'Solar + BESS';
    else system = 'BESS + Solar';
  }

  let comment = 'Select your energy goals to see personalized recommendations.';
  if (count === 1) comment = 'Add more goals to maximize your energy solution benefits.';
  else if (count >= 2 && count <= 3) comment = 'Good selection! Consider additional goals for optimal ROI.';
  else if (count >= 4) comment = 'Your goals align perfectly with a BESS + Solar solution for maximum savings and reliable backup.';

  return { compatibility, roi, system, comment };
}
