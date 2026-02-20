/**
 * =============================================================================
 * CAR WASH 16Q VISUAL INDICATORS
 * =============================================================================
 * 
 * Visual components for displaying calculator confidence and warnings:
 * - Confidence badges ("Estimate" vs "Verified")
 * - Service utilization warnings
 * - Expansion alerts
 * - Power quality risk indicators
 * - Backup runtime display
 */

import React from 'react';
import type { CarWash16QResult } from '@/services/carWash16QCalculator';

// =============================================================================
// CONFIDENCE BADGE
// =============================================================================

interface ConfidenceBadgeProps {
  confidence: 'estimate' | 'verified';
  uncertaintyCount?: number;
}

export function ConfidenceBadge({ confidence, uncertaintyCount = 0 }: ConfidenceBadgeProps) {
  const isEstimate = confidence === 'estimate';
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
      isEstimate 
        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }`}>
      <span className={`inline-block w-2 h-2 rounded-full ${
        isEstimate ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />
      <span>
        {isEstimate ? 'Estimate' : 'Verified'}
        {uncertaintyCount > 0 && ` (${uncertaintyCount} uncertain)`}
      </span>
    </div>
  );
}

// =============================================================================
// SERVICE UTILIZATION WARNING
// =============================================================================

interface ServiceUtilizationProps {
  serviceUtilization: number;
  serviceLimitReached: boolean;
  serviceCapacityKW: number;
  peakDemandKW: number;
}

export function ServiceUtilizationWarning({
  serviceUtilization,
  serviceLimitReached,
  serviceCapacityKW,
  peakDemandKW,
}: ServiceUtilizationProps) {
  const utilizationPct = Math.round(serviceUtilization * 100);
  
  // Color coding based on utilization
  const getColorClass = () => {
    if (serviceLimitReached || serviceUtilization >= 0.90) return 'red';
    if (serviceUtilization >= 0.75) return 'amber';
    return 'emerald';
  };
  
  const color = getColorClass();
  
  return (
    <div className={`rounded-lg border p-4 ${
      color === 'red' ? 'bg-red-50 border-red-200' :
      color === 'amber' ? 'bg-amber-50 border-amber-200' :
      'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${
          color === 'red' ? 'text-red-500' :
          color === 'amber' ? 'text-amber-500' :
          'text-emerald-500'
        }`}>
          {color === 'red' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {color === 'amber' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {color === 'emerald' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-semibold text-sm mb-1 ${
            color === 'red' ? 'text-red-900' :
            color === 'amber' ? 'text-amber-900' :
            'text-emerald-900'
          }`}>
            Service Utilization: {utilizationPct}%
          </h4>
          
          <p className={`text-sm ${
            color === 'red' ? 'text-red-700' :
            color === 'amber' ? 'text-amber-700' :
            'text-emerald-700'
          }`}>
            {serviceLimitReached ? (
              <>
                <strong>⚠️ Service capacity reached!</strong> Peak demand ({peakDemandKW.toFixed(0)} kW) exceeds your electrical service capacity ({serviceCapacityKW.toFixed(0)} kW). Consider upgrading your service panel or implementing load management.
              </>
            ) : serviceUtilization >= 0.90 ? (
              <>
                <strong>High utilization warning.</strong> Your electrical service is operating near capacity. BESS can provide peak shaving to reduce service demand.
              </>
            ) : serviceUtilization >= 0.75 ? (
              <>
                Moderate utilization. You have some headroom for equipment expansion, but peak shaving is recommended for cost savings.
              </>
            ) : (
              <>
                Good headroom available. Your electrical service can handle current and moderate future load growth.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPANSION HEADROOM ALERT
// =============================================================================

interface ExpansionHeadroomProps {
  expansionHeadroomKW: number;
  futureLoadKW: number;
  peakDemandKW: number;
}

export function ExpansionHeadroomAlert({
  expansionHeadroomKW,
  futureLoadKW,
  peakDemandKW,
}: ExpansionHeadroomProps) {
  if (expansionHeadroomKW <= 0) return null;
  
  const increasePercent = Math.round((expansionHeadroomKW / peakDemandKW) * 100);
  
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-blue-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-blue-900 mb-1">
            Expansion Planning: +{expansionHeadroomKW.toFixed(0)} kW
          </h4>
          
          <p className="text-sm text-blue-700">
            Based on your expansion plans, future peak demand is projected at {futureLoadKW.toFixed(0)} kW 
            (+{increasePercent}% increase). BESS sizing includes headroom for future equipment.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// POWER QUALITY RISK INDICATOR
// =============================================================================

interface PowerQualityRiskProps {
  powerQualityRisk: 'low' | 'medium' | 'high';
}

export function PowerQualityRiskIndicator({
  powerQualityRisk,
}: PowerQualityRiskProps) {
  if (powerQualityRisk === 'low') return null;
  
  const color = powerQualityRisk === 'high' ? 'red' : 'amber';
  
  return (
    <div className={`rounded-lg border p-4 ${
      color === 'red' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${color === 'red' ? 'text-red-500' : 'text-amber-500'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className={`font-semibold text-sm mb-1 ${
            color === 'red' ? 'text-red-900' : 'text-amber-900'
          }`}>
            Power Quality Risk: {powerQualityRisk === 'high' ? 'High' : 'Medium'}
          </h4>
          
          <p className={`text-sm ${color === 'red' ? 'text-red-700' : 'text-amber-700'}`}>
            Power quality issues detected. BESS with power conditioning can improve reliability and protect sensitive equipment.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BACKUP RUNTIME DISPLAY
// =============================================================================

interface BackupRuntimeProps {
  backupRuntimeHours: number;
  bessRecommendedKWh: number;
  peakDemandKW: number;
}

export function BackupRuntimeDisplay({
  backupRuntimeHours,
  bessRecommendedKWh,
  peakDemandKW: _peakDemandKW,
}: BackupRuntimeProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-slate-900 mb-1">
            Backup Runtime: {backupRuntimeHours.toFixed(1)} hours
          </h4>
          
          <p className="text-sm text-slate-700">
            With {bessRecommendedKWh.toFixed(0)} kWh of storage, your system can provide backup power 
            during grid outages for {backupRuntimeHours === 0 ? 'critical shutdown procedures' : 
            backupRuntimeHours === 1 ? 'immediate recovery operations' :
            backupRuntimeHours === 2 ? 'essential operations during short outages' :
            'extended critical operations during prolonged outages'}.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPLETE METRICS CARD (Combines All Indicators)
// =============================================================================

interface CarWashMetricsCardProps {
  result: CarWash16QResult;
}

export function CarWashMetricsCard({ result }: CarWashMetricsCardProps) {
  return (
    <div className="space-y-4">
      {/* Confidence Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Power Analysis Results
        </h3>
        <ConfidenceBadge 
          confidence={result.confidence} 
          uncertaintyCount={result.uncertaintyCount} 
        />
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Peak Demand</div>
          <div className="text-2xl font-bold text-slate-900">
            {result.peakDemandKW.toFixed(0)} kW
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Recommended BESS</div>
          <div className="text-2xl font-bold text-slate-900">
            {result.bessRecommendedKW.toFixed(0)} kW / {result.bessRecommendedKWh.toFixed(0)} kWh
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Annual Savings</div>
          <div className="text-2xl font-bold text-emerald-600">
            ${result.totalAnnualSavings.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Daily Energy</div>
          <div className="text-2xl font-bold text-slate-900">
            {result.dailyEnergyKWh.toFixed(0)} kWh
          </div>
        </div>
      </div>
      
      {/* Visual Indicators */}
      <div className="space-y-3">
        <ServiceUtilizationWarning
          serviceUtilization={result.serviceUtilization}
          serviceLimitReached={result.serviceLimitReached}
          serviceCapacityKW={result.serviceCapacityKW}
          peakDemandKW={result.peakDemandKW}
        />
        
        <ExpansionHeadroomAlert
          expansionHeadroomKW={result.expansionHeadroomKW}
          futureLoadKW={result.futureLoadKW}
          peakDemandKW={result.peakDemandKW}
        />
        
        <PowerQualityRiskIndicator
          powerQualityRisk={result.powerQualityRisk}
        />
        
        <BackupRuntimeDisplay
          backupRuntimeHours={result.backupRuntimeHours}
          bessRecommendedKWh={result.bessRecommendedKWh}
          peakDemandKW={result.peakDemandKW}
        />
      </div>
    </div>
  );
}
