/**
 * Generic SMB Wizard
 * ==================
 * 
 * A database-driven, industry-agnostic wizard for SMB verticals.
 * Reads configuration from:
 * - smb_sites table (branding, features)
 * - industry_power_profiles table (sizing defaults)
 * - calculation_constants table (pricing)
 * 
 * Usage:
 * <SMBWizard industrySlug="ev-charging-hub" />
 * <SMBWizard industrySlug="hotel" />
 * 
 * @module SMBWizard
 * @version 1.0.0
 * @date November 30, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sun, Battery, ChevronRight, ChevronLeft, Building2, Car, Hotel, Utensils, ShoppingBag, MapPin, DollarSign, TrendingUp, Shield, Leaf } from 'lucide-react';

// Services
import { getIndustryProfile, type IndustryPowerProfile } from '@/services/industryPowerProfilesService';
import { supabase } from '@/services/supabaseClient';

// ✅ SSOT: Use QuoteEngine for all quote generation
import { QuoteEngine } from '@/core/calculations';

// ============================================
// TYPES
// ============================================

interface SMBSiteConfig {
  slug: string;
  name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  features: {
    showSolar: boolean;
    showWind: boolean;
    showGenerator: boolean;
    showEV: boolean;
    showFinancing: boolean;
    showBackupPower?: boolean;
    showDemandChargeAnalysis?: boolean;
  };
}

interface WizardState {
  // Step 1: Business Info
  unitCount: number;
  location: string;
  zipCode: string;
  
  // Step 2: Energy Goals
  primaryGoal: 'cost_reduction' | 'backup_power' | 'sustainability' | 'ev_charging';
  currentMonthlyBill: number;
  
  // Step 3: System Options
  wantsSolar: boolean;
  wantsBackup: boolean;
  wantsEV: boolean;
  
  // Calculated
  recommendedBatteryKWh: number;
  recommendedSolarKW: number;
}

interface QuoteResult {
  batteryKWh: number;
  batteryCost: number;
  solarKW: number;
  solarCost: number;
  totalCost: number;
  netCost: number;
  annualSavings: number;
  paybackYears: number;
  roi5Year: number;  // Changed from roi10Year to 5-year for more credible ROI timeline
  co2ReductionTons: number;
}

interface SMBWizardProps {
  industrySlug: string;
  onComplete?: (result: QuoteResult) => void;
}

// ============================================
// INDUSTRY ICONS
// ============================================

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  'car-wash': <Car className="w-8 h-8" />,
  'ev-charging-hub': <Zap className="w-8 h-8" />,
  'hotel': <Hotel className="w-8 h-8" />,
  'restaurant': <Utensils className="w-8 h-8" />,
  'laundromat': <ShoppingBag className="w-8 h-8" />,
  'default': <Building2 className="w-8 h-8" />,
};

// ============================================
// COMPONENT
// ============================================

export const SMBWizard: React.FC<SMBWizardProps> = ({ industrySlug, onComplete }) => {
  // State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SMBSiteConfig | null>(null);
  const [industryProfile, setIndustryProfile] = useState<IndustryPowerProfile | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  const [wizardState, setWizardState] = useState<WizardState>({
    unitCount: 5,
    location: '',
    zipCode: '',
    primaryGoal: 'cost_reduction',
    currentMonthlyBill: 2000,
    wantsSolar: true,
    wantsBackup: true,
    wantsEV: false,
    recommendedBatteryKWh: 0,
    recommendedSolarKW: 0,
  });

  // Load site config and industry profile
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        // Load industry profile
        const profile = await getIndustryProfile(industrySlug);
        setIndustryProfile(profile);
        
        // Load site config from database
        const { data: siteData } = await supabase
          .from('smb_sites')
          .select('*')
          .eq('slug', industrySlug)
          .single();
        
        if (siteData) {
          setSiteConfig({
            slug: siteData.slug,
            name: siteData.name,
            tagline: siteData.tagline,
            primary_color: siteData.primary_color,
            secondary_color: siteData.secondary_color,
            features: siteData.features || {},
          });
        } else {
          // Fallback config
          setSiteConfig({
            slug: industrySlug,
            name: `${industrySlug.replace('-', ' ')} Energy Solutions`,
            tagline: 'Battery Energy Storage Solutions',
            primary_color: '#6366F1',
            secondary_color: '#4F46E5',
            features: { showSolar: true, showWind: false, showGenerator: true, showEV: true, showFinancing: true },
          });
        }
        
        // Set default unit count based on industry
        if (profile) {
          setWizardState(prev => ({
            ...prev,
            unitCount: industrySlug === 'hotel' ? 100 : industrySlug === 'ev-charging-hub' ? 8 : 5,
          }));
        }
      } catch (error) {
        console.error('Failed to load SMB config:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadConfig();
  }, [industrySlug]);

  // Calculate recommendations when inputs change
  useEffect(() => {
    if (industryProfile && wizardState.unitCount > 0) {
      const batteryKWh = wizardState.unitCount * industryProfile.recommended_battery_kwh_per_unit;
      const solarKW = wizardState.wantsSolar 
        ? wizardState.unitCount * industryProfile.recommended_solar_kw_per_unit 
        : 0;
      
      setWizardState(prev => ({
        ...prev,
        recommendedBatteryKWh: batteryKWh,
        recommendedSolarKW: solarKW,
      }));
    }
  }, [industryProfile, wizardState.unitCount, wizardState.wantsSolar]);

  // Calculate quote using QuoteEngine (SSOT)
  const generateQuote = async () => {
    if (!industryProfile) return;
    
    setCalculating(true);
    try {
      const batteryKWh = wizardState.recommendedBatteryKWh;
      const solarKW = wizardState.recommendedSolarKW;
      
      // ✅ SSOT: Use QuoteEngine.generateQuote() for all quote calculations
      const quoteResult = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, batteryKWh / 1000 / 4), // Convert kWh to MW (assume 4hr duration)
        durationHours: 4,
        solarMW: solarKW / 1000,
        location: wizardState.location || 'United States',
        electricityRate: industryProfile.avg_electricity_rate,
        useCase: industrySlug,
        gridConnection: 'on-grid',
      });
      
      const result: QuoteResult = {
        batteryKWh,
        batteryCost: quoteResult.equipment.batteries.totalCost,
        solarKW,
        solarCost: quoteResult.equipment.solar?.totalCost || 0,
        totalCost: quoteResult.costs.totalProjectCost,
        netCost: quoteResult.costs.netCost,
        annualSavings: quoteResult.financials.annualSavings,
        paybackYears: quoteResult.financials.paybackYears,
        roi5Year: quoteResult.financials.roi5Year,
        co2ReductionTons: (solarKW * 1500 * 0.0004), // ~0.4 kg CO2/kWh avoided
      };
      
      setQuoteResult(result);
      onComplete?.(result);
    } catch (error) {
      console.error('Quote calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Navigation
  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      if (step === 3) {
        generateQuote();
      }
    }
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Get industry icon
  const IndustryIcon = useMemo(() => {
    return INDUSTRY_ICONS[industrySlug] || INDUSTRY_ICONS['default'];
  }, [industrySlug]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render
  return (
    <div 
      className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl"
      style={{ '--primary-color': siteConfig?.primary_color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: `${siteConfig?.primary_color}20` }}
        >
          <div style={{ color: siteConfig?.primary_color }}>{IndustryIcon}</div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{siteConfig?.name}</h1>
        <p className="text-gray-600">{siteConfig?.tagline}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                s <= step 
                  ? 'text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
              style={{ 
                backgroundColor: s <= step ? siteConfig?.primary_color : undefined 
              }}
            >
              {s}
            </div>
            {s < 4 && (
              <div 
                className={`w-16 h-1 mx-2 rounded ${s < step ? '' : 'bg-gray-200'}`}
                style={{ backgroundColor: s < step ? siteConfig?.primary_color : undefined }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Business Info */}
          {step === 1 && industryProfile && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Tell us about your business</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many {industryProfile.unit_plural} do you have?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={wizardState.unitCount || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setWizardState({ ...wizardState, unitCount: Math.min(1000, parseInt(val) || 0) });
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Typical {industrySlug.replace('-', ' ')}: {industryProfile.typical_peak_demand_kw} kW peak demand
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  ZIP Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="Enter ZIP code"
                  value={wizardState.zipCode}
                  onChange={(e) => setWizardState({ ...wizardState, zipCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Current Monthly Electric Bill
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={wizardState.currentMonthlyBill || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setWizardState({ ...wizardState, currentMonthlyBill: Math.min(100000, parseInt(val) || 0) });
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">What's your primary goal?</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cost_reduction', icon: TrendingUp, label: 'Reduce Energy Costs', desc: 'Peak shaving & demand charge reduction' },
                  { id: 'backup_power', icon: Shield, label: 'Backup Power', desc: 'Keep operations running during outages' },
                  { id: 'sustainability', icon: Leaf, label: 'Sustainability', desc: 'Reduce carbon footprint' },
                  { id: 'ev_charging', icon: Car, label: 'EV Charging', desc: 'Add or expand EV charging' },
                ].map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setWizardState({ ...wizardState, primaryGoal: goal.id as any })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      wizardState.primaryGoal === goal.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: wizardState.primaryGoal === goal.id ? siteConfig?.primary_color : undefined,
                      backgroundColor: wizardState.primaryGoal === goal.id ? `${siteConfig?.primary_color}10` : undefined,
                    }}
                  >
                    <goal.icon className="w-6 h-6 mb-2" style={{ color: siteConfig?.primary_color }} />
                    <div className="font-medium text-gray-900">{goal.label}</div>
                    <div className="text-sm text-gray-500">{goal.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: System Options */}
          {step === 3 && siteConfig && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Customize Your System</h2>
              
              <div className="space-y-4">
                {siteConfig.features.showSolar && (
                  <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={wizardState.wantsSolar}
                      onChange={(e) => setWizardState({ ...wizardState, wantsSolar: e.target.checked })}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <Sun className="w-6 h-6 ml-4 text-yellow-500" />
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">Add Solar Panels</div>
                      <div className="text-sm text-gray-500">
                        Recommended: {wizardState.recommendedSolarKW.toFixed(0)} kW
                      </div>
                    </div>
                  </label>
                )}
                
                <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={wizardState.wantsBackup}
                    onChange={(e) => setWizardState({ ...wizardState, wantsBackup: e.target.checked })}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <Shield className="w-6 h-6 ml-4 text-green-500" />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Backup Power Capability</div>
                    <div className="text-sm text-gray-500">
                      {industryProfile?.recommended_backup_hours || 4} hours of backup
                    </div>
                  </div>
                </label>
                
                {siteConfig.features.showEV && (
                  <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={wizardState.wantsEV}
                      onChange={(e) => setWizardState({ ...wizardState, wantsEV: e.target.checked })}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <Car className="w-6 h-6 ml-4 text-blue-500" />
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">EV Charging Integration</div>
                      <div className="text-sm text-gray-500">
                        Add EV charging for guests/employees
                      </div>
                    </div>
                  </label>
                )}
              </div>
              
              {/* Recommended System Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Recommended System</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Battery className="w-5 h-5 inline mr-2 text-indigo-600" />
                    <span className="font-medium">{wizardState.recommendedBatteryKWh.toLocaleString()} kWh</span>
                    <span className="text-gray-500 ml-1">Battery Storage</span>
                  </div>
                  {wizardState.wantsSolar && (
                    <div>
                      <Sun className="w-5 h-5 inline mr-2 text-yellow-500" />
                      <span className="font-medium">{wizardState.recommendedSolarKW.toFixed(0)} kW</span>
                      <span className="text-gray-500 ml-1">Solar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Custom Quote</h2>
              
              {calculating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <span className="ml-4 text-gray-600">Calculating your personalized quote...</span>
                </div>
              ) : quoteResult ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${quoteResult.annualSavings.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Annual Savings</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {quoteResult.paybackYears.toFixed(1)} yrs
                      </div>
                      <div className="text-sm text-blue-700">Payback Period</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {quoteResult.roi5Year.toFixed(0)}%
                      </div>
                      <div className="text-sm text-purple-700">10-Year ROI</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {quoteResult.co2ReductionTons.toFixed(0)} tons
                      </div>
                      <div className="text-sm text-emerald-700">CO₂ Avoided/Year</div>
                    </div>
                  </div>
                  
                  {/* System Details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">System Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Battery Storage</span>
                        <span className="font-medium">{quoteResult.batteryKWh.toLocaleString()} kWh</span>
                      </div>
                      {quoteResult.solarKW > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Solar Array</span>
                          <span className="font-medium">{quoteResult.solarKW.toFixed(0)} kW</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equipment Cost</span>
                        <span className="font-medium">${quoteResult.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Federal Tax Credit (30%)</span>
                        <span className="font-medium">-${(quoteResult.totalCost * 0.3).toLocaleString()}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Cost</span>
                        <span style={{ color: siteConfig?.primary_color }}>
                          ${quoteResult.netCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <div className="text-center pt-4">
                    <button
                      className="px-8 py-4 rounded-lg text-white font-semibold text-lg transition-transform hover:scale-105"
                      style={{ backgroundColor: siteConfig?.primary_color }}
                    >
                      Get Detailed Proposal
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Free, no-obligation consultation with a Merlin energy expert
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Unable to calculate quote. Please try again.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        
        {step < 4 && (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105"
            style={{ backgroundColor: siteConfig?.primary_color }}
          >
            {step === 3 ? 'Calculate Quote' : 'Next'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        )}
      </div>
      
      {/* Powered by Merlin */}
      <div className="text-center mt-6 text-sm text-gray-400">
        Powered by <span className="font-semibold">Merlin Smart Energy</span>
      </div>
    </div>
  );
};

export default SMBWizard;
