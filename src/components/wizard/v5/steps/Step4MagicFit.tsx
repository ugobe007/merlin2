/**
 * STEP 4: MAGIC FIT™ - THE BIG REVEAL
 * ====================================
 * 
 * Created: December 21, 2025
 * 
 * This is THE MOMENT - Merlin delivers the magic.
 * Not "here are some options" - it's "I've analyzed everything. 
 * Here's your perfect system."
 * 
 * Design Principles:
 * - CONFIDENCE: Merlin is delivering, not suggesting
 * - IMPACT: Big numbers, bold colors, savings that HIT you
 * - ENERGY: Dark, electric, powerful (SpaceX launch control vibes)
 * - CELEBRATION: Selection triggers celebration
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Zap, Battery, Sun, DollarSign, Clock, CheckCircle, Sparkles,
  TrendingUp, Shield, Rocket, Target, ArrowRight, Star,
  BarChart3, Award, ChevronUp
} from 'lucide-react';
import { COLORS } from '../design-system';
import { calculateDatabaseBaseline, type BaselineCalculationResult } from '@/services/baselineService';

// Merlin profile image
const merlinProfile = '/images/new_profile_merlin.png';

// ============================================
// TYPES
// ============================================

interface Step4Props {
  selectedIndustry: string;
  useCaseData: Record<string, any>;
  state: string;
  goals: string[];
  electricityRate: number; // Required - from state selection
  // System sizing values
  batteryKW: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;
  gridConnection: 'on-grid' | 'off-grid' | 'limited';
  // Handlers
  onBatteryChange: (kw: number) => void;
  onDurationChange: (hours: number) => void;
  onSolarChange: (kw: number) => void;
  onGeneratorChange: (kw: number) => void;
  onGridConnectionChange: (type: 'on-grid' | 'off-grid' | 'limited') => void;
  // Navigation
  onContinue?: () => void;
}

type PowerLevel = 'starter' | 'perfect' | 'beast';

interface PowerLevelConfig {
  id: PowerLevel;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  batteryPercent: number;    // % of recommended
  durationHours: number;
  solarPercent: number;      // % of battery
  color: string;
  gradient: string;
  glowColor: string;
}

// ============================================
// POWER LEVEL CONFIGURATIONS
// ============================================

const POWER_LEVELS: PowerLevelConfig[] = [
  {
    id: 'starter',
    name: 'STARTER',
    tagline: 'Smart & efficient',
    icon: Zap,
    batteryPercent: 70,
    durationHours: 3,
    solarPercent: 80,
    color: 'text-cyan-400',
    gradient: 'from-cyan-600/80 to-blue-700/80',
    glowColor: 'rgba(34, 211, 238, 0.4)',
  },
  {
    id: 'perfect',
    name: 'PERFECT FIT',
    tagline: "Merlin's pick ⭐",
    icon: Target,
    batteryPercent: 100,
    durationHours: 4,
    solarPercent: 100,
    color: 'text-purple-400',
    gradient: 'from-purple-600/90 to-indigo-700/90',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
  {
    id: 'beast',
    name: 'BEAST MODE',
    tagline: 'Maximum savings',
    icon: Rocket,
    batteryPercent: 140,
    durationHours: 6,
    solarPercent: 120,
    color: 'text-amber-400',
    gradient: 'from-amber-600/80 to-orange-700/80',
    glowColor: 'rgba(251, 191, 36, 0.4)',
  },
];

// ============================================
// ANIMATED COUNTER HOOK
// ============================================

function useAnimatedCounter(targetValue: number, duration: number = 1500, startDelay: number = 0) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        setDisplayValue(Math.round(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, [targetValue, duration, startDelay]);
  
  return displayValue;
}

// ============================================
// CONFETTI BURST COMPONENT
// ============================================

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            backgroundColor: ['#8B5CF6', '#00D4FF', '#10B981', '#FFD700', '#F59E0B'][Math.floor(Math.random() * 5)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ============================================
// PARTICLE BACKGROUND
// ============================================

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        .animate-float { animation: float 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export const Step4MagicFit: React.FC<Step4Props> = ({
  selectedIndustry,
  useCaseData,
  state,
  goals,
  electricityRate = 0.12,
  batteryKW,
  durationHours,
  solarKW,
  generatorKW,
  gridConnection,
  onBatteryChange,
  onDurationChange,
  onSolarChange,
  onGeneratorChange,
  onGridConnectionChange,
  onContinue,
}) => {
  const [recommendation, setRecommendation] = useState<BaselineCalculationResult | null>(null);
  const [originalRecommendation, setOriginalRecommendation] = useState<BaselineCalculationResult | null>(null);
  const [userModifiedValues, setUserModifiedValues] = useState<{batteryKW: number, solarKW: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PowerLevel>('perfect');
  const [superSizedCards, setSuperSizedCards] = useState<Record<PowerLevel, boolean>>({
    starter: false,
    perfect: false,
    beast: false,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Create a hash of inputs to detect actual changes
  const inputsHash = useMemo(() => {
    return JSON.stringify({
      selectedIndustry,
      useCaseData,
      state,
      goals,
      electricityRate
    });
  }, [selectedIndustry, useCaseData, state, goals, electricityRate]);

  // Toggle super size for a specific card
  const toggleSuperSize = useCallback((level: PowerLevel) => {
    setSuperSizedCards(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  }, []);

  // Restore Merlin's recommendation - uses stored original values
  const handleRestoreRecommendation = useCallback(() => {
    if (originalRecommendation) {
      const originalBatteryKW = originalRecommendation.powerMW * 1000;
      const originalSolarKW = originalRecommendation.solarMW * 1000;
      onBatteryChange(originalBatteryKW);
      onSolarChange(originalSolarKW);
      setUserModifiedValues(null);
    }
  }, [originalRecommendation, onBatteryChange, onSolarChange]);
  
  // Restore Merlin's recommendation for a specific card (legacy - for super size toggle)
  const restoreDefault = useCallback((level: PowerLevel) => {
    setSuperSizedCards(prev => ({
      ...prev,
      [level]: false
    }));
  }, []);

  // Store original recommendation separately - only calculate once per input set
  const lastInputsHashRef = useRef<string>('');
  
  // Get AI recommendation from SSOT - only recalculate when inputs actually change
  useEffect(() => {
    async function getRecommendation() {
      if (!selectedIndustry) {
        setLoading(false);
        return;
      }

      // Skip if inputs haven't changed
      if (inputsHash === lastInputsHashRef.current && originalRecommendation) {
        setRecommendation(originalRecommendation);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // calculateDatabaseBaseline expects (template, scale, useCaseData)
        // For college: useCaseData contains peakDemandKW from presets
        // The scale is less important since college calculation uses useCaseData directly
        const scale = useCaseData?.peakDemandKW 
          || useCaseData?.squareFootage 
          || useCaseData?.totalBuildingSqFt 
          || useCaseData?.roomCount 
          || useCaseData?.bayCount 
          || useCaseData?.studentEnrollment
          || useCaseData?.buildingCount
          || 1;
        const result = await calculateDatabaseBaseline(selectedIndustry, scale, useCaseData);
        setRecommendation(result);
        // Store as original if this is the first calculation or inputs changed
        if (!originalRecommendation || inputsHash !== lastInputsHashRef.current) {
          setOriginalRecommendation(result);
          lastInputsHashRef.current = inputsHash;
        }
      } catch (error) {
        console.error('❌ Step4: Baseline error:', error);
        setError(error instanceof Error ? error.message : 'Failed to calculate baseline. Please try again.');
        // Set fallback recommendation so component can still render
        const fallbackRecommendation: BaselineCalculationResult = {
          powerMW: 0.5,
          durationHrs: 4,
          solarMW: 0,
          peakDemandMW: 0.5,
          description: 'Fallback configuration',
          dataSource: 'Error fallback'
        };
        setRecommendation(fallbackRecommendation);
        if (!originalRecommendation) {
          setOriginalRecommendation(fallbackRecommendation);
        }
      } finally {
        setLoading(false);
      }
    }

    getRecommendation();
  }, [selectedIndustry, inputsHash, originalRecommendation]); // Depend on inputsHash to detect changes

  // Get recommended values (fallback to reasonable defaults)
  // BaselineCalculationResult uses MW, convert to kW
  const recommendedBatteryKW = recommendation ? (recommendation.powerMW * 1000) : (batteryKW || 500);
  
  // ✅ FIX: Use user-configured solar if provided (from Step 3 modal), otherwise use recommendation
  const userSolarKW = solarKW > 0 ? solarKW : 0;
  const recommendedSolarKW = userSolarKW > 0 
    ? userSolarKW 
    : (recommendation ? (recommendation.solarMW * 1000) : Math.round(recommendedBatteryKW * 1.2));
  
  // ✅ FIX: Include EV load from user config (from Step 3 modal)
  const evLoadKW = useCaseData?.evLoadKW || 0;
  
  // Peak demand includes EV charger load if configured
  const basePeakDemandKW = recommendation?.peakDemandMW ? (recommendation.peakDemandMW * 1000) : (recommendedBatteryKW * 1.5);
  const peakDemandKW = basePeakDemandKW + evLoadKW;
  
  // Debug: Log user config values
  if (import.meta.env.DEV) {
    console.log('📊 Step4 User Config:', {
      userSolarKW,
      evLoadKW,
      basePeakDemandKW,
      totalPeakDemandKW: peakDemandKW,
      useCaseDataKeys: Object.keys(useCaseData || {}),
    });
  }

  // Calculate configurations for each power level
  const configurations = useMemo(() => {
    return POWER_LEVELS.map(level => {
      // Each card has its own super size state
      const superSizeMultiplier = superSizedCards[level.id] ? 1.4 : 1.0;
      
      // Battery size scales with level + EV load if present
      const baseBatteryKW = recommendedBatteryKW * (level.batteryPercent / 100);
      // Add 50% of EV load to battery (for peak shaving EV charging)
      const evBatteryBoost = evLoadKW * 0.5 * (level.batteryPercent / 100);
      const configBatteryKW = Math.round((baseBatteryKW + evBatteryBoost) * superSizeMultiplier);
      const configBatteryKWh = configBatteryKW * level.durationHours;
      
      // ✅ FIX: Use user's solar if configured, otherwise calculate from battery
      const configSolarKW = userSolarKW > 0 
        ? Math.round(userSolarKW * (level.solarPercent / 100)) // Scale user's solar by level
        : Math.round(configBatteryKW * (level.solarPercent / 100)); // Default calculation
      
      // Calculate savings (simplified - real calculation would use SSOT services)
      const demandChargeSavings = configBatteryKW * 12 * 12; // $12/kW demand charge × 12 months
      const energyArbitrageSavings = configBatteryKWh * 365 * 0.08; // ~$0.08/kWh arbitrage spread
      const solarSavings = configSolarKW * 1500 * electricityRate; // 1500 kWh/kW annual production
      
      // ✅ FIX: Add EV charging savings if configured
      const evSavings = evLoadKW > 0 
        ? evLoadKW * 8 * 365 * 0.10 // 8 hours avg usage, $0.10/kWh savings from peak shaving
        : 0;
      
      const totalAnnualSavings = Math.round(demandChargeSavings + energyArbitrageSavings + solarSavings + evSavings);
      
      // Estimate costs (simplified)
      const batteryCost = configBatteryKWh * 250; // $250/kWh installed
      const solarCost = configSolarKW * 1200; // $1.20/W installed
      const totalCost = batteryCost + solarCost;
      const netCost = totalCost * 0.7; // After 30% ITC
      
      const paybackYears = netCost / totalAnnualSavings;
      
      return {
        ...level,
        batteryKW: configBatteryKW,
        batteryKWh: configBatteryKWh,
        solarKW: configSolarKW,
        evLoadKW: evLoadKW,
        totalAnnualSavings,
        totalCost,
        netCost,
        paybackYears: Math.round(paybackYears * 10) / 10,
        isSuperSized: superSizedCards[level.id],
      };
    });
  }, [recommendedBatteryKW, userSolarKW, evLoadKW, electricityRate, superSizedCards]);

  // Get selected configuration
  const selectedConfig = configurations.find(c => c.id === selectedLevel) || configurations[1];
  
  // Count answered questions
  const answeredQuestions = Object.keys(useCaseData).filter(k => useCaseData[k] !== undefined && useCaseData[k] !== '').length;

  // Animated values
  const animatedSavings = useAnimatedCounter(selectedConfig.totalAnnualSavings, 1200, 300);
  const animatedPeakDemand = useAnimatedCounter(peakDemandKW, 1000, 100);

  // Handle level selection
  const handleSelectLevel = useCallback((level: PowerLevel) => {
    setSelectedLevel(level);
    setIsLocked(true);
    setShowConfetti(true);
    
    // Update parent state with selected configuration
    const config = configurations.find(c => c.id === level);
    if (config) {
      onBatteryChange(config.batteryKW);
      onDurationChange(config.durationHours);
      onSolarChange(config.solarKW);
    }
    
    // Clear confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  }, [configurations, onBatteryChange, onDurationChange, onSolarChange]);

  // Format helpers
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value}`;
  };

  const formatPower = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
    return `${Math.round(kw)} kW`;
  };

  const formatEnergy = (kwh: number) => {
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${Math.round(kwh)} kWh`;
  };

  // Get industry display name
  const getIndustryDisplayName = (slug: string) => {
    const names: Record<string, string> = {
      'hotel': 'Hotel',
      'car-wash': 'Car Wash',
      'ev-charging': 'EV Charging Station',
      'college': 'College & University',
      'hospital': 'Hospital',
      'data-center': 'Data Center',
      'manufacturing': 'Manufacturing Facility',
      'retail': 'Retail',
      'warehouse': 'Warehouse',
      'office': 'Office Building',
    };
    return names[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Merlin is crunching the numbers...</p>
          {selectedIndustry && (
            <p className="text-white/40 text-sm mt-2">Analyzing {selectedIndustry}...</p>
          )}
        </div>
      </div>
    );
  }

  // Error state (but still render with fallback)
  if (error && !recommendation) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Calculation Error</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <p className="text-white/40 text-sm">Please check your inputs and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[800px]">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Confetti Burst */}
      <ConfettiBurst active={showConfetti} />
      
      <div className="relative z-10">
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN HERO PANEL - The Big Reveal
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/30 shadow-2xl shadow-purple-500/20 relative overflow-hidden">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Merlin Avatar with glow */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
              <img 
                src={merlinProfile} 
                alt="Merlin" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#0a0a1a] shadow-lg shadow-emerald-500/50">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                "I've crunched the numbers for your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  {getIndustryDisplayName(selectedIndustry)}
                </span>
                {state && <span className="text-white/80"> in {state}</span>}"
              </h2>
              
              {/* Key Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                {/* Peak Demand */}
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-3xl font-black text-white">
                      {formatPower(animatedPeakDemand)}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">Peak Demand</p>
                </div>
                
                {/* Divider */}
                <div className="hidden md:block w-px h-12 bg-white/20" />
                
                {/* Max Savings */}
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      {formatCurrency(animatedSavings)}/yr
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">Savings Potential</p>
                </div>
                
                {/* Divider */}
                <div className="hidden md:block w-px h-12 bg-white/20" />
                
                {/* Data Points */}
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span className="text-3xl font-black text-white">
                      {Math.max(answeredQuestions, 8)}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">Data Points</p>
                </div>
              </div>
              
              {/* Confidence Message */}
              <p className="mt-4 text-white/70 flex items-center gap-2 justify-center md:justify-start">
                <Award className="w-4 h-4 text-amber-400" />
                Based on your inputs, I'm <strong className="text-white">95% confident</strong> these configurations will deliver results.
              </p>
            </div>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            SECTION HEADER
        ═══════════════════════════════════════════════════════════════ */}
        <div className="text-center mb-8">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
            CHOOSE YOUR{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              POWER LEVEL
            </span>
          </h3>
          <p className="text-white/60">
            Each option is optimized for your facility's unique profile
          </p>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            POWER LEVEL CARDS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {configurations.map((config) => {
            const isSelected = selectedLevel === config.id;
            const Icon = config.icon;
            
            return (
              <div key={config.id} className="flex flex-col">
              <button
                onClick={() => handleSelectLevel(config.id)}
                className={`relative p-6 rounded-3xl border-2 transition-all duration-300 text-left group flex-1 ${
                  isSelected
                    ? `bg-gradient-to-br ${config.gradient} border-white/30 scale-[1.02]`
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.01]'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 40px ${config.glowColor}` : undefined,
                }}
              >
                {/* Recommended Badge */}
                {config.id === 'perfect' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5 shadow-lg shadow-purple-500/40">
                    <Star className="w-3 h-3 fill-current" />
                    MERLIN'S PICK
                  </div>
                )}
                
                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center animate-bounce-once">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
                
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isSelected 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10'
                  }`}>
                    <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : config.color}`} />
                  </div>
                  <div>
                    <h4 className={`text-xl font-black ${isSelected ? 'text-white' : 'text-white/90'}`}>
                      {config.name}
                    </h4>
                    <p className={`text-sm ${isSelected ? 'text-white/70' : 'text-white/50'}`}>
                      {config.tagline}
                    </p>
                  </div>
                </div>
                
                {/* System Specs */}
                <div className={`grid grid-cols-2 gap-3 mb-5 p-4 rounded-2xl ${
                  isSelected ? 'bg-black/20' : 'bg-white/[0.02]'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                      <Battery className="w-3 h-3" /> Power
                    </div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {formatPower(config.batteryKW)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {config.durationHours} hours
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                      <Zap className="w-3 h-3" /> Storage
                    </div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {formatEnergy(config.batteryKWh)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                      <Sun className="w-3 h-3" /> Solar
                    </div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {formatPower(config.solarKW)}
                    </p>
                  </div>
                </div>
                
                {/* SAVINGS - THE BIG NUMBER */}
                <div className={`text-center p-4 rounded-2xl mb-4 ${
                  isSelected 
                    ? 'bg-emerald-500/20 border border-emerald-400/30' 
                    : 'bg-emerald-500/10'
                }`}>
                  <p className="text-emerald-400/70 text-xs uppercase tracking-wider mb-1">Annual Savings</p>
                  <p className={`font-black ${
                    isSelected ? 'text-5xl text-emerald-300' : 'text-4xl text-emerald-400'
                  } drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]`}>
                    {formatCurrency(config.totalAnnualSavings)}
                    <span className="text-lg font-bold text-emerald-400/70">/yr</span>
                  </p>
                </div>
                
                {/* Payback Period */}
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-cyan-400/60'}`} />
                  <span className={`font-semibold ${isSelected ? 'text-cyan-200' : 'text-white/60'}`}>
                    {config.paybackYears} year payback
                  </span>
                  {config.id === 'perfect' && (
                    <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-xs font-bold rounded-full">
                      BEST ROI
                    </span>
                  )}
                </div>
                
                {/* Selection Indicator */}
                <div className={`mt-4 py-3 rounded-xl text-center font-bold transition-all ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/70'
                }`}>
                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                </div>
                
                {/* Super Size Badge (shows when active) */}
                {config.isSuperSized && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-amber-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    +40%
                  </div>
                )}
              </button>
              
              {/* SUPER SIZE BUTTON - Below each card */}
              <div className="mt-4 mb-2">
                {config.isSuperSized ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreDefault(config.id);
                      handleRestoreRecommendation();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border-2 border-emerald-400 hover:from-emerald-500 hover:to-teal-500 transition-all text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                  >
                    <Shield className="w-4 h-4" />
                    ✓ Restore Merlin's Pick
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSuperSize(config.id);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-amber-400 hover:from-amber-400 hover:to-orange-400 transition-all text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
                  >
                    <Rocket className="w-4 h-4" />
                    🚀 SUPER SIZE +40%
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BUILD MY QUOTE BUTTON - Prominent CTA
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mt-8 mb-6 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-white/70 text-sm mb-2">
              Ready to see your personalized quote?
            </p>
            <button
              onClick={() => {
                if (onContinue) {
                  onContinue();
                } else {
                  // Fallback: scroll to and highlight the Continue button
                  const nextButton = document.querySelector('button[class*="Continue"], button[class*="Get My Quote"]') as HTMLElement;
                  if (nextButton) {
                    nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    nextButton.classList.add('animate-pulse');
                    setTimeout(() => nextButton.classList.remove('animate-pulse'), 2000);
                  }
                }
              }}
              className="relative px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-400 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transition-all duration-300 flex items-center gap-3 border-2 border-purple-400/50 overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              <Sparkles className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Build My Quote</span>
              <ArrowRight className="w-6 h-6 relative z-10" />
            </button>
            <p className="text-white/50 text-xs mt-2">
              Or click "Continue" in the bottom right corner →
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDER INSTRUCTIONS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Fine-Tune Your System
          </h3>
          <p className="text-white/70 mb-4">
            Use the sliders below to customize your configuration. Merlin will recalculate your savings in real-time.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Battery className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Battery Size</p>
                <p className="text-white/50">More storage = more savings & backup time</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sun className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Solar Capacity</p>
                <p className="text-white/50">Generate your own clean energy</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Duration</p>
                <p className="text-white/50">How long you need backup power</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            FINE-TUNE CONFIGURATION SLIDERS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-10 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Fine-Tune Your Configuration
          </h4>
          <p className="text-white/50 text-sm mb-6">
            Adjust these values manually if you want to customize beyond the presets
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Battery Power Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/70 text-sm font-medium flex items-center gap-2">
                  <Battery className="w-4 h-4 text-purple-400" />
                  Battery Power
                </label>
                <span className="text-purple-400 font-bold">{formatPower(batteryKW)}</span>
              </div>
              <input
                type="range"
                min={100}
                max={Math.max(10000, recommendedBatteryKW * 2)}
                value={batteryKW}
                onChange={(e) => onBatteryChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>100 kW</span>
                <span>{formatPower(Math.max(10000, recommendedBatteryKW * 2))}</span>
              </div>
            </div>
            
            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/70 text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Duration
                </label>
                <span className="text-cyan-400 font-bold">{durationHours} hours</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={durationHours}
                onChange={(e) => onDurationChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>1 hr</span>
                <span>8 hrs</span>
              </div>
            </div>
            
            {/* Solar Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/70 text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Solar
                </label>
                <span className="text-amber-400 font-bold">{formatPower(solarKW)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(5000, batteryKW * 1.5)}
                value={solarKW}
                onChange={(e) => onSolarChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>0</span>
                <span>{formatPower(Math.max(5000, batteryKW * 1.5))}</span>
              </div>
            </div>
            
            {/* Generator Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/70 text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  Backup Generator
                </label>
                <span className="text-red-400 font-bold">{formatPower(generatorKW)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(2000, batteryKW)}
                value={generatorKW}
                onChange={(e) => onGeneratorChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>0</span>
                <span>{formatPower(Math.max(2000, batteryKW))}</span>
              </div>
            </div>
          </div>
          
          {/* Storage Capacity Display */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total Storage Capacity:</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                {formatEnergy(batteryKW * durationHours)}
              </span>
            </div>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            LOCKED IN CONFIRMATION
        ═══════════════════════════════════════════════════════════════ */}
        {isLocked && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-teal-900/40 border border-emerald-500/30 animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-emerald-300">
                LOCKED IN: {selectedConfig.name}
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-xl p-4 text-center">
                <Battery className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{formatPower(selectedConfig.batteryKW)}</p>
                <p className="text-white/50 text-xs">Power</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{formatEnergy(selectedConfig.batteryKWh)}</p>
                <p className="text-white/50 text-xs">Storage</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 text-center">
                <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-bold text-lg">{formatCurrency(selectedConfig.totalAnnualSavings)}/yr</p>
                <p className="text-white/50 text-xs">Savings</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{selectedConfig.paybackYears} yrs</p>
                <p className="text-white/50 text-xs">Payback</p>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
        
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-bounce-once { animation: bounce-once 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default Step4MagicFit;
