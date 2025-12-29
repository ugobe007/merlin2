/**
 * STEP 3 RECOMMENDATION MODAL (ENHANCED)
 * =======================================
 * 
 * Appears after Step 3 completion, before Step 4 (Magic Fit)
 * Shows comprehensive AI-driven recommendations with financial projections
 * 
 * Key Features:
 * - Three ROI scenarios: Conservative, Medium, Aggressive
 * - Detailed breakdown for Solar, Generator, EV Charging
 * - BESS always included (shown separately)
 * - Visual confidence indicators
 * - User confirms which add-ons to include in final quote
 * - Clean, professional design matching Merlin brand
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sun, Battery, Zap, AlertTriangle, CheckCircle, 
  Sparkles, TrendingUp, TrendingDown, DollarSign, 
  Leaf, ArrowRight, ChevronDown, ChevronUp,
  Flame, Building2, Clock, PiggyBank, Shield,
  Info, Check, Minus
} from 'lucide-react';
import { calculateRAVS, type RAVSInput, type RAVSScore } from '@/services/ravsService';
import { RAVSDisplay } from './RAVSDisplay';

export interface OpportunityPreferences {
  wantsSolar: boolean;
  wantsGenerator: boolean;
  wantsEV: boolean;
}

// Extended interface to include configured sizes
export interface OpportunityConfiguration extends OpportunityPreferences {
  solarKW?: number;      // Configured solar system size (kW)
  generatorKW?: number;  // Configured generator size (kW)
  evConfig?: {
    level2Count?: number;
    dcFastCount?: number;
    // Add more EV config fields as needed
  };
}

export interface Step3RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (configuration: OpportunityConfiguration) => void;
  
  // Input data from wizard steps
  state: string;
  zipCode?: string;
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  electricityRate: number;
  industry: string;
  industryLabel?: string;
  useCaseData: Record<string, any>;
  goals: string[];
  baselineKW?: number;
  peakKW?: number;
  
  // Initial preferences from earlier in flow
  initialPreferences?: OpportunityPreferences;
}

// Financial projection scenarios
interface ScenarioMetrics {
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  npv: number;
  initialCost: number;
  monthlyPayment?: number;
}

interface OpportunityAnalysis {
  type: 'solar' | 'generator' | 'ev';
  recommended: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  conservative: ScenarioMetrics;
  medium: ScenarioMetrics;
  aggressive: ScenarioMetrics;
  keyFactors: string[];
  risks: string[];
}

// Solar potential by state (peak sun hours)
const SOLAR_HOURS: Record<string, number> = {
  'AZ': 6.5, 'NV': 6.4, 'NM': 6.2, 'CA': 5.8, 'TX': 5.5, 'CO': 5.5, 'UT': 5.6,
  'FL': 5.4, 'HI': 5.5, 'OK': 5.2, 'KS': 5.3, 'NE': 5.0, 'GA': 5.1, 'SC': 5.1,
  'NC': 5.0, 'TN': 4.8, 'AL': 4.9, 'LA': 4.8, 'MS': 4.8, 'AR': 4.9, 'MO': 4.8,
  'VA': 4.7, 'MD': 4.5, 'DE': 4.5, 'NJ': 4.4, 'PA': 4.2, 'OH': 4.2, 'IN': 4.4,
  'IL': 4.5, 'WI': 4.3, 'MI': 4.0, 'MN': 4.5, 'IA': 4.6, 'ND': 4.8, 'SD': 5.0,
  'MT': 4.8, 'WY': 5.2, 'ID': 4.9, 'OR': 4.2, 'WA': 3.8, 'NY': 4.0, 'CT': 4.2,
  'MA': 4.2, 'RI': 4.3, 'VT': 4.0, 'NH': 4.1, 'ME': 4.0, 'WV': 4.3, 'KY': 4.5,
  'AK': 3.0,
};

// EV adoption multipliers
const EV_MULTIPLIERS: Record<string, number> = {
  'CA': 1.5, 'WA': 1.3, 'OR': 1.3, 'CO': 1.2, 'MA': 1.2, 'NV': 1.1, 
  'AZ': 1.1, 'FL': 1.0, 'TX': 1.0, 'NY': 1.1, 'NJ': 1.1, 'HI': 1.2,
};

export const Step3RecommendationModal: React.FC<Step3RecommendationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  state,
  zipCode,
  gridConnection,
  electricityRate,
  industry,
  industryLabel,
  useCaseData,
  goals,
  baselineKW,
  peakKW,
  initialPreferences,
}) => {
  const [analyses, setAnalyses] = useState<OpportunityAnalysis[]>([]);
  const [bessAnalysis, setBessAnalysis] = useState<OpportunityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Calculate baseline and peak if not provided
  const calculatedBaselineKW = baselineKW || useCaseData.baselineKW || 100;
  const calculatedPeakKW = peakKW || useCaseData.peakKW || calculatedBaselineKW * 1.5;
  
  // User's selections (can modify from AI recommendations)
  const [selections, setSelections] = useState<OpportunityPreferences>({
    wantsSolar: initialPreferences?.wantsSolar ?? false,
    wantsGenerator: initialPreferences?.wantsGenerator ?? false,
    wantsEV: initialPreferences?.wantsEV ?? false,
  });
  
  // Configured sizes (auto-calculated from facility data, user can modify)
  const [configuredSizes, setConfiguredSizes] = useState<{
    solarKW: number;
    generatorKW: number;
    evLevel2Count: number;
    evDCFastCount: number;
  }>({
    solarKW: 0,
    generatorKW: 0,
    evLevel2Count: 0,
    evDCFastCount: 0,
  });
  
  // Auto-calculate sizes when modal opens or facility data changes
  useEffect(() => {
    if (isOpen && useCaseData) {
      // Auto-calculate solar from rooftop square footage
      const rooftopSqFt = useCaseData.rooftopSquareFootage || 0;
      const autoSolarKW = rooftopSqFt > 0 ? Math.floor(rooftopSqFt / 100) : 0; // 100 sq ft per kW
      
      // Auto-calculate generator size (20% buffer over peak)
      const autoGeneratorKW = calculatedPeakKW > 0 ? Math.round(calculatedPeakKW * 1.2) : 0;
      
      // Default EV config (can be adjusted)
      const defaultEVLevel2 = 4;
      const defaultEVDCFast = 2;
      
      setConfiguredSizes({
        solarKW: autoSolarKW,
        generatorKW: autoGeneratorKW,
        evLevel2Count: defaultEVLevel2,
        evDCFastCount: defaultEVDCFast,
      });
    }
  }, [isOpen, useCaseData, calculatedPeakKW]);

  // Calculate all analyses when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      // Simulate analysis (in production, this would call your services)
      setTimeout(() => {
        const sunHours = SOLAR_HOURS[state] || 4.5;
        const evMultiplier = EV_MULTIPLIERS[state] || 0.9;
        const needsBackup = gridConnection === 'unreliable' || gridConnection === 'limited' || gridConnection === 'off-grid';
        const highRates = electricityRate > 0.12;
        
        // Generate analyses
        const newAnalyses: OpportunityAnalysis[] = [];
        
        // Solar Analysis - Check if rooftop space is available
        const rooftopSqFt = useCaseData?.rooftopSquareFootage || 0;
        const hasRooftopSpace = rooftopSqFt >= 500; // Minimum 500 sq ft for viable solar
        const solarSizeKW = hasRooftopSpace 
          ? Math.min(Math.floor(rooftopSqFt / 100), calculatedBaselineKW * 0.8, 500) // Use actual rooftop space
          : 0; // No viable solar if no rooftop space
        
        const solarCostPerWatt = solarSizeKW > 100 ? 1.80 : solarSizeKW > 50 ? 2.00 : 2.20;
        const annualProduction = solarSizeKW * sunHours * 365 * 0.85; // kWh with 85% efficiency
        const solarRecommended = hasRooftopSpace && (sunHours >= 4.5 || (sunHours >= 4.0 && highRates));
        
        // If user wants solar but no rooftop space, recommend generator as alternative
        const wantsSolarButNoSpace = (initialPreferences?.wantsSolar ?? false) && !hasRooftopSpace;
        
        newAnalyses.push({
          type: 'solar',
          recommended: solarRecommended && !wantsSolarButNoSpace,
          confidence: hasRooftopSpace ? (sunHours >= 5.0 ? 'high' : sunHours >= 4.5 ? 'medium' : 'low') : 'low',
          reasoning: wantsSolarButNoSpace
            ? `You expressed interest in solar, but your facility has insufficient rooftop space (${rooftopSqFt.toLocaleString()} sq ft available, minimum 500 sq ft needed). Consider a backup generator for reliable power instead.`
            : !hasRooftopSpace
            ? `Insufficient rooftop space for solar (${rooftopSqFt.toLocaleString()} sq ft available, minimum 500 sq ft needed). Consider ground-mount solar or backup generator.`
            : solarRecommended
            ? `${state} receives ${sunHours} peak sun hours daily. With ${rooftopSqFt.toLocaleString()} sq ft of rooftop space, a ${solarSizeKW.toFixed(0)}kW system can offset significant energy costs.`
            : `Solar potential in ${state} is limited (${sunHours} sun hours). May still provide value depending on your specific situation.`,
          conservative: calculateSolarScenario(solarSizeKW, solarCostPerWatt, annualProduction, electricityRate * 0.9, 'conservative'),
          medium: calculateSolarScenario(solarSizeKW, solarCostPerWatt, annualProduction, electricityRate, 'medium'),
          aggressive: calculateSolarScenario(solarSizeKW, solarCostPerWatt, annualProduction, electricityRate * 1.1, 'aggressive'),
          keyFactors: [
            hasRooftopSpace ? `${rooftopSqFt.toLocaleString()} sq ft rooftop available` : 'Insufficient rooftop space',
            hasRooftopSpace ? `${solarSizeKW.toFixed(0)}kW system capacity` : 'Consider ground-mount or generator',
            `${sunHours} peak sun hours/day`,
            `30% Federal ITC available`,
            highRates ? 'High utility rates favor solar' : 'Moderate utility rates',
            (initialPreferences?.wantsEV ?? false) && hasRooftopSpace ? 'Can power EV chargers during day' : '',
          ].filter(Boolean),
          risks: [
            !hasRooftopSpace ? 'Insufficient rooftop space - consider alternatives' : 'Weather variability affects production',
            'Roof condition/orientation constraints',
            'Utility rate changes over time',
          ],
        });

        // Generator Analysis
        const genSizeKW = calculatedPeakKW * 1.2; // 20% buffer for peak
        const genCostPerKW = genSizeKW > 200 ? 350 : genSizeKW > 100 ? 400 : 450;
        // Recommend generator if: needs backup, OR user wants solar but has no rooftop space
        const genRecommended = needsBackup || goals.includes('resilience') || goals.includes('backup-power') || wantsSolarButNoSpace;
        
        newAnalyses.push({
          type: 'generator',
          recommended: genRecommended,
          confidence: (needsBackup || wantsSolarButNoSpace) ? 'high' : 'medium',
          reasoning: wantsSolarButNoSpace
            ? `Since solar isn't viable due to limited rooftop space, a ${genSizeKW.toFixed(0)}kW generator provides reliable backup power and operational continuity.`
            : genRecommended
            ? needsBackup 
              ? `Your ${gridConnection} grid connection makes backup power essential. A ${genSizeKW.toFixed(0)}kW generator ensures operational continuity.`
              : `Backup generation provides business continuity insurance. At ${genSizeKW.toFixed(0)}kW, you're covered for peak demand.`
            : `With reliable grid connection, generator may be optional. Consider for disaster preparedness.`,
          conservative: calculateGenScenario(genSizeKW, genCostPerKW, calculatedPeakKW, 'conservative'),
          medium: calculateGenScenario(genSizeKW, genCostPerKW, calculatedPeakKW, 'medium'),
          aggressive: calculateGenScenario(genSizeKW, genCostPerKW, calculatedPeakKW, 'aggressive'),
          keyFactors: [
            `${genSizeKW.toFixed(0)}kW capacity`,
            `Covers ${calculatedPeakKW.toFixed(0)}kW peak + 20% buffer`,
            needsBackup ? 'Critical for grid reliability' : 'Business continuity insurance',
          ],
          risks: [
            'Fuel cost variability',
            'Maintenance requirements',
            'Emissions considerations',
          ],
        });

        // EV Charging Analysis - Optimize if Solar is also selected
        const hasSolar = (initialPreferences?.wantsSolar ?? false) && hasRooftopSpace;
        const evStations = Math.max(2, Math.floor(calculatedBaselineKW / 50)); // Rough sizing
        const evCostPerStation = 45000; // Level 2 + DCFC mix
        // If solar is included, EV can use solar power during day, reducing grid demand
        const evGridDemandReduction = hasSolar ? 0.3 : 0; // 30% reduction if solar powers EV during day
        const evRevenue = evStations * 8 * 365 * 0.35 * evMultiplier; // 8 sessions/day avg, $0.35 margin
        const evRecommended = evMultiplier >= 1.0 || goals.includes('revenue') || goals.includes('customer-attraction');
        
        newAnalyses.push({
          type: 'ev',
          recommended: evRecommended,
          confidence: evMultiplier >= 1.2 ? 'high' : evMultiplier >= 1.0 ? 'medium' : 'low',
          reasoning: hasSolar && evRecommended
            ? `EV adoption in ${state} is ${evMultiplier >= 1.2 ? 'among the highest nationwide' : 'growing steadily'}. ${evStations} charging stations can generate significant revenue. Combined with your solar system, EV charging can be powered by solar during peak sun hours, maximizing savings.`
            : evRecommended
            ? `EV adoption in ${state} is ${evMultiplier >= 1.2 ? 'among the highest nationwide' : 'growing steadily'}. ${evStations} charging stations can generate significant revenue.`
            : `EV market in ${state} is emerging. Consider strategic positioning for future growth.`,
          conservative: calculateEVScenario(evStations, evCostPerStation, evRevenue * 0.7, 'conservative'),
          medium: calculateEVScenario(evStations, evCostPerStation, evRevenue, 'medium'),
          aggressive: calculateEVScenario(evStations, evCostPerStation, evRevenue * 1.4, 'aggressive'),
          keyFactors: [
            `${evStations} stations recommended`,
            `Mix of Level 2 & DC Fast`,
            evMultiplier >= 1.0 ? 'Strong local EV adoption' : 'Growing EV market',
            'Customer attraction benefits',
            hasSolar ? 'Solar-powered charging during peak hours' : '',
            hasSolar ? `${(evGridDemandReduction * 100).toFixed(0)}% grid demand reduction` : '',
          ].filter(Boolean),
          risks: [
            'Utilization depends on traffic',
            'Technology evolution pace',
            'Competition from other chargers',
          ],
        });

        // BESS Analysis (always included)
        const bessSizeKWh = calculatedBaselineKW * 4; // 4-hour duration
        const bessCostPerKWh = bessSizeKWh > 500 ? 350 : bessSizeKWh > 200 ? 400 : 450;
        const arbitrageValue = highRates ? calculatedBaselineKW * 0.08 * 365 : calculatedBaselineKW * 0.04 * 365; // Peak shaving value
        const demandSavings = calculatedPeakKW * 15 * 12; // Demand charge reduction
        
        setBessAnalysis({
          type: 'solar', // Reusing type for compatibility
          recommended: true,
          confidence: 'high',
          reasoning: `Battery storage is the foundation of your energy system. At ${bessSizeKWh.toFixed(0)}kWh, it enables peak shaving, arbitrage, and backup power.`,
          conservative: calculateBESSScenario(bessSizeKWh, bessCostPerKWh, arbitrageValue + demandSavings * 0.5, 'conservative'),
          medium: calculateBESSScenario(bessSizeKWh, bessCostPerKWh, arbitrageValue + demandSavings * 0.7, 'medium'),
          aggressive: calculateBESSScenario(bessSizeKWh, bessCostPerKWh, arbitrageValue + demandSavings, 'aggressive'),
          keyFactors: [
            `${bessSizeKWh.toFixed(0)}kWh capacity`,
            '4-hour duration',
            'Peak shaving & arbitrage',
            'Backup power capability',
          ],
          risks: [
            'Battery degradation over time',
            'Technology improvements',
          ],
        });

        setAnalyses(newAnalyses);
        
        // Set initial selections based on recommendations
        setSelections({
          wantsSolar: initialPreferences?.wantsSolar ?? newAnalyses.find(a => a.type === 'solar')?.recommended ?? false,
          wantsGenerator: initialPreferences?.wantsGenerator ?? newAnalyses.find(a => a.type === 'generator')?.recommended ?? false,
          wantsEV: initialPreferences?.wantsEV ?? newAnalyses.find(a => a.type === 'ev')?.recommended ?? false,
        });
        
        setLoading(false);
      }, 2000);
    }
  }, [isOpen, state, gridConnection, electricityRate, calculatedBaselineKW, calculatedPeakKW, goals, initialPreferences]);

  // Helper functions for scenario calculations
  function calculateSolarScenario(sizeKW: number, costPerWatt: number, annualKWh: number, rate: number, scenario: string): ScenarioMetrics {
    const grossCost = sizeKW * 1000 * costPerWatt;
    const itc = scenario === 'aggressive' ? 0.30 : 0.30; // ITC
    const netCost = grossCost * (1 - itc);
    const annualSavings = annualKWh * rate * (scenario === 'conservative' ? 0.85 : scenario === 'aggressive' ? 1.05 : 0.95);
    const degradation = scenario === 'conservative' ? 0.995 : 0.997; // Annual degradation
    
    let npv = -netCost;
    const discountRate = scenario === 'conservative' ? 0.08 : scenario === 'aggressive' ? 0.05 : 0.06;
    for (let year = 1; year <= 25; year++) {
      npv += (annualSavings * Math.pow(degradation, year)) / Math.pow(1 + discountRate, year);
    }
    
    return {
      annualSavings: Math.round(annualSavings),
      paybackYears: Math.round((netCost / annualSavings) * 10) / 10,
      roi10Year: Math.round(((annualSavings * 10 - netCost) / netCost) * 100),
      npv: Math.round(npv),
      initialCost: Math.round(netCost),
      monthlyPayment: Math.round(netCost / 120), // 10-year financing
    };
  }

  function calculateGenScenario(sizeKW: number, costPerKW: number, peakKW: number, scenario: string): ScenarioMetrics {
    const baseCost = sizeKW * costPerKW;
    const installCost = baseCost * 0.25;
    const totalCost = baseCost + installCost;
    
    // Value is in avoided downtime
    const hourlyRevenue = peakKW * 0.15 * (scenario === 'conservative' ? 80 : scenario === 'aggressive' ? 150 : 100);
    const outageHours = scenario === 'conservative' ? 8 : scenario === 'aggressive' ? 24 : 16; // Annual outage hours
    const annualValue = hourlyRevenue * outageHours + (peakKW * 2 * 12); // Plus insurance value
    
    return {
      annualSavings: Math.round(annualValue),
      paybackYears: Math.round((totalCost / annualValue) * 10) / 10,
      roi10Year: Math.round(((annualValue * 10 - totalCost) / totalCost) * 100),
      npv: Math.round(annualValue * 8 - totalCost), // 8-year NPV
      initialCost: Math.round(totalCost),
    };
  }

  function calculateEVScenario(stations: number, costPerStation: number, annualRevenue: number, scenario: string): ScenarioMetrics {
    const totalCost = stations * costPerStation;
    const opex = totalCost * 0.05; // 5% annual operating costs
    const netRevenue = annualRevenue - opex;
    
    return {
      annualSavings: Math.round(netRevenue),
      paybackYears: Math.round((totalCost / netRevenue) * 10) / 10,
      roi10Year: Math.round(((netRevenue * 10 - totalCost) / totalCost) * 100),
      npv: Math.round(netRevenue * 7 - totalCost),
      initialCost: Math.round(totalCost),
    };
  }

  function calculateBESSScenario(sizeKWh: number, costPerKWh: number, annualValue: number, scenario: string): ScenarioMetrics {
    const grossCost = sizeKWh * costPerKWh;
    const itc = 0.30; // ITC
    const netCost = grossCost * (1 - itc);
    const adjustedValue = annualValue * (scenario === 'conservative' ? 0.8 : scenario === 'aggressive' ? 1.2 : 1.0);
    
    return {
      annualSavings: Math.round(adjustedValue),
      paybackYears: Math.round((netCost / adjustedValue) * 10) / 10,
      roi10Year: Math.round(((adjustedValue * 10 - netCost) / netCost) * 100),
      npv: Math.round(adjustedValue * 8 - netCost),
      initialCost: Math.round(netCost),
    };
  }

  const toggleSelection = (type: 'solar' | 'generator' | 'ev') => {
    setSelections(prev => ({
      ...prev,
      wantsSolar: type === 'solar' ? !prev.wantsSolar : prev.wantsSolar,
      wantsGenerator: type === 'generator' ? !prev.wantsGenerator : prev.wantsGenerator,
      wantsEV: type === 'ev' ? !prev.wantsEV : prev.wantsEV,
    }));
  };

  const toggleExpanded = (type: string) => {
    setExpandedCards(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleConfirm = () => {
    // Return configuration with sizes
    const configuration: OpportunityConfiguration = {
      wantsSolar: selections.wantsSolar,
      wantsGenerator: selections.wantsGenerator,
      wantsEV: selections.wantsEV,
      solarKW: selections.wantsSolar ? configuredSizes.solarKW : undefined,
      generatorKW: selections.wantsGenerator ? configuredSizes.generatorKW : undefined,
      evConfig: selections.wantsEV ? {
        level2Count: configuredSizes.evLevel2Count,
        dcFastCount: configuredSizes.evDCFastCount,
      } : undefined,
    };
    onConfirm(configuration);
  };

  // Helper function to calculate RAVS for an opportunity
  const calculateRAVSForOpportunity = (
    type: 'solar' | 'generator' | 'ev' | 'bess',
    analysis: OpportunityAnalysis,
    scenario: 'conservative' | 'medium' | 'aggressive' = 'medium'
  ): RAVSScore => {
    const metrics = scenario === 'conservative' ? analysis.conservative :
                    scenario === 'aggressive' ? analysis.aggressive :
                    analysis.medium;
    
    // Estimate IRR from annual savings and initial cost
    const estimatedIRR = metrics.initialCost > 0 
      ? Math.min(25, Math.max(0, (metrics.annualSavings / metrics.initialCost) * 100 * 1.2))
      : 10;
    
    const ravsInput: RAVSInput = {
      financial: {
        npv: metrics.npv,
        irr: estimatedIRR,
        paybackYears: metrics.paybackYears,
        roi10Year: metrics.roi10Year,
        initialInvestment: metrics.initialCost,
      },
      project: {
        systemType: type === 'solar' ? 'solar+bess' : 
                    type === 'generator' ? 'generator' : 
                    type === 'ev' ? 'ev' : 'bess',
        systemSizeKW: calculatedBaselineKW,
        durationHours: type === 'bess' ? 4 : undefined,
        state: state,
        gridConnection: gridConnection,
        industry: industry,
      },
      market: {
        electricityRate: electricityRate,
        incentivesAvailable: true,
        itcPercentage: 30,
        stateIncentives: ['CA', 'NY', 'MA', 'NJ', 'CT', 'CO'].includes(state),
        netMeteringAvailable: !['TX', 'AZ'].includes(state),
      },
      operational: {
        warrantyYears: type === 'solar' ? 25 : type === 'bess' ? 15 : 10,
        expectedLifeYears: type === 'solar' ? 30 : type === 'bess' ? 20 : 15,
        maintenanceIncluded: false,
        installerTier: 'standard',
        equipmentTier: 'tier1',
      },
    };
    
    return calculateRAVS(ravsInput);
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solar': return <Sun className="w-6 h-6" />;
      case 'generator': return <Flame className="w-6 h-6" />;
      case 'ev': return <Zap className="w-6 h-6" />;
      default: return <Battery className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solar': return 'from-amber-500 to-orange-500';
      case 'generator': return 'from-red-500 to-orange-600';
      case 'ev': return 'from-emerald-500 to-teal-500';
      default: return 'from-purple-500 to-indigo-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'solar': return 'Solar Energy';
      case 'generator': return 'Backup Generator';
      case 'ev': return 'EV Charging';
      default: return 'Battery Storage';
    }
  };

  const isSelected = (type: string) => {
    switch (type) {
      case 'solar': return selections.wantsSolar;
      case 'generator': return selections.wantsGenerator;
      case 'ev': return selections.wantsEV;
      default: return true;
    }
  };

  // Calculate total investment for selected items
  const getTotalInvestment = () => {
    let total = bessAnalysis?.medium.initialCost || 0;
    analyses.forEach(a => {
      if ((a.type === 'solar' && selections.wantsSolar) ||
          (a.type === 'generator' && selections.wantsGenerator) ||
          (a.type === 'ev' && selections.wantsEV)) {
        total += a.medium.initialCost;
      }
    });
    return total;
  };

  const getTotalSavings = () => {
    let total = bessAnalysis?.medium.annualSavings || 0;
    analyses.forEach(a => {
      if ((a.type === 'solar' && selections.wantsSolar) ||
          (a.type === 'generator' && selections.wantsGenerator) ||
          (a.type === 'ev' && selections.wantsEV)) {
        total += a.medium.annualSavings;
      }
    });
    return total;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-8">
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-5xl w-full mx-4 my-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-md border-b border-purple-500/30 px-6 py-5 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Merlin's Recommendations</h2>
                <p className="text-purple-200 text-sm mt-0.5">
                  {industryLabel || industry} in {state} • {calculatedBaselineKW.toFixed(0)}kW baseline
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <p className="mt-4 text-white/80 font-medium">Calculating your recommendations...</p>
              <p className="text-purple-300/60 text-sm mt-1">Analyzing financial projections across scenarios</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Total Investment
                  </div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(getTotalInvestment())}</div>
                  <div className="text-xs text-purple-300/60 mt-1">After 30% ITC</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-300 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Annual Savings
                  </div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(getTotalSavings())}</div>
                  <div className="text-xs text-emerald-300/60 mt-1">Year 1 estimate</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-300 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Avg Payback
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {(getTotalInvestment() / getTotalSavings()).toFixed(1)} yrs
                  </div>
                  <div className="text-xs text-amber-300/60 mt-1">Medium scenario</div>
                </div>
              </div>

              {/* BESS Card (Always Included) */}
              {bessAnalysis && (
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl border-2 border-purple-500/50 overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Battery className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">Battery Energy Storage (BESS)</h3>
                          <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs font-medium rounded-full border border-purple-500/50">
                            Always Included
                          </span>
                        </div>
                        <p className="text-purple-200/70 text-sm">{bessAnalysis.reasoning}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpanded('bess')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {expandedCards['bess'] ? <ChevronUp className="w-5 h-5 text-white/60" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
                    </button>
                  </div>
                  
                  {expandedCards['bess'] && bessAnalysis && (
                    <div className="px-4 pb-4 border-t border-purple-500/20 pt-4">
                      <ScenarioTable 
                        analysis={bessAnalysis} 
                        formatCurrency={formatCurrency}
                        type="bess"
                        state={state}
                        gridConnection={gridConnection}
                        electricityRate={electricityRate}
                        baselineKW={calculatedBaselineKW}
                        industry={industry}
                        calculateRAVSForOpportunity={calculateRAVSForOpportunity}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Opportunity Cards */}
              {analyses.map((analysis) => (
                <div
                  key={analysis.type}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${
                    isSelected(analysis.type)
                      ? 'bg-slate-800/60 border-emerald-500/50'
                      : 'bg-slate-800/30 border-white/10'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(analysis.type)} rounded-xl flex items-center justify-center`}>
                        {getTypeIcon(analysis.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{getTypeLabel(analysis.type)}</h3>
                          {analysis.recommended && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/50 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Recommended
                            </span>
                          )}
                          {!analysis.recommended && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/50">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm mt-0.5 line-clamp-1">{analysis.reasoning}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Toggle Button */}
                      <button
                        onClick={() => toggleSelection(analysis.type as 'solar' | 'generator' | 'ev')}
                        className={`
                          px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                          ${isSelected(analysis.type)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }
                        `}
                      >
                        {isSelected(analysis.type) ? (
                          <>
                            <Check className="w-4 h-4" />
                            Included
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => toggleExpanded(analysis.type)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {expandedCards[analysis.type] ? <ChevronUp className="w-5 h-5 text-white/60" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedCards[analysis.type] && (
                    <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                      {/* Key Factors */}
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyFactors.map((factor, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white/5 text-white/70 text-xs rounded-lg">
                            {factor}
                          </span>
                        ))}
                      </div>
                      
                      {/* Scenario Table */}
                      <ScenarioTable 
                        analysis={analysis} 
                        formatCurrency={formatCurrency}
                        type={analysis.type}
                        state={state}
                        gridConnection={gridConnection}
                        electricityRate={electricityRate}
                        baselineKW={calculatedBaselineKW}
                        industry={industry}
                        calculateRAVSForOpportunity={calculateRAVSForOpportunity}
                      />
                      
                      {/* Risks */}
                      <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-200/80">
                          <span className="font-medium">Considerations:</span> {analysis.risks.join(' • ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-purple-500/20 px-6 py-4 bg-slate-900/95 backdrop-blur-md rounded-b-3xl flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all text-sm"
          >
            Go Back
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-white/50">Selected Configuration</div>
              <div className="text-sm text-white font-medium">
                BESS{selections.wantsSolar ? ' + Solar' : ''}{selections.wantsGenerator ? ' + Generator' : ''}{selections.wantsEV ? ' + EV' : ''}
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`
                px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all text-sm
                flex items-center gap-2
                ${loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30'
                }
              `}
            >
              Build My Quote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scenario comparison table component (Enhanced with RAVS)
interface ScenarioTableProps {
  analysis: OpportunityAnalysis;
  formatCurrency: (n: number) => string;
  type: 'solar' | 'generator' | 'ev' | 'bess';
  state: string;
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  electricityRate: number;
  baselineKW: number;
  industry: string;
  calculateRAVSForOpportunity?: (
    type: 'solar' | 'generator' | 'ev' | 'bess',
    analysis: OpportunityAnalysis,
    scenario?: 'conservative' | 'medium' | 'aggressive'
  ) => RAVSScore;
}

const ScenarioTable: React.FC<ScenarioTableProps> = ({ 
  analysis, 
  formatCurrency, 
  type,
  state,
  gridConnection,
  electricityRate,
  baselineKW,
  industry,
  calculateRAVSForOpportunity
}) => {
  // Calculate RAVS for medium scenario
  const ravsScore = useMemo(() => {
    if (!calculateRAVSForOpportunity) return null;
    try {
      return calculateRAVSForOpportunity(type, analysis, 'medium');
    } catch (error) {
      console.warn('RAVS calculation failed:', error);
      return null;
    }
  }, [analysis, type, calculateRAVSForOpportunity]);

  return (
    <div className="space-y-4">
      {/* RAVS Badge - Compact view above the table */}
      {ravsScore && (
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <RAVSDisplay score={ravsScore} variant="badge" animated={false} />
            <div className="text-xs text-white/50">
              Risk-Adjusted Value Score (medium scenario)
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            ravsScore.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
            ravsScore.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {ravsScore.riskLevel.charAt(0).toUpperCase() + ravsScore.riskLevel.slice(1)} Risk
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-white/60 font-medium">Metric</th>
            <th className="text-right py-3 px-3 text-blue-400 font-semibold">
              <div className="flex items-center justify-end gap-1">
                <Shield className="w-3.5 h-3.5" />
                Conservative
              </div>
            </th>
            <th className="text-right py-3 px-3 text-purple-400 font-semibold">
              <div className="flex items-center justify-end gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Medium
              </div>
            </th>
            <th className="text-right py-3 px-3 text-emerald-400 font-semibold">
              <div className="flex items-center justify-end gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Aggressive
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-white/80">
          <tr className="border-b border-white/5">
            <td className="py-2.5 px-4">Initial Investment</td>
            <td className="text-right px-3 text-blue-300">{formatCurrency(analysis.conservative.initialCost)}</td>
            <td className="text-right px-3 text-purple-300">{formatCurrency(analysis.medium.initialCost)}</td>
            <td className="text-right px-3 text-emerald-300">{formatCurrency(analysis.aggressive.initialCost)}</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2.5 px-4">Annual Savings/Revenue</td>
            <td className="text-right px-3">{formatCurrency(analysis.conservative.annualSavings)}</td>
            <td className="text-right px-3">{formatCurrency(analysis.medium.annualSavings)}</td>
            <td className="text-right px-3">{formatCurrency(analysis.aggressive.annualSavings)}</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2.5 px-4">Payback Period</td>
            <td className="text-right px-3">{analysis.conservative.paybackYears} yrs</td>
            <td className="text-right px-3">{analysis.medium.paybackYears} yrs</td>
            <td className="text-right px-3">{analysis.aggressive.paybackYears} yrs</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2.5 px-4">10-Year ROI</td>
            <td className="text-right px-3">{analysis.conservative.roi10Year}%</td>
            <td className="text-right px-3">{analysis.medium.roi10Year}%</td>
            <td className="text-right px-3">{analysis.aggressive.roi10Year}%</td>
          </tr>
          <tr>
            <td className="py-2.5 px-4">Net Present Value</td>
            <td className="text-right px-3 text-blue-300">{formatCurrency(analysis.conservative.npv)}</td>
            <td className="text-right px-3 text-purple-300">{formatCurrency(analysis.medium.npv)}</td>
            <td className="text-right px-3 text-emerald-300">{formatCurrency(analysis.aggressive.npv)}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default Step3RecommendationModal;
